import * as _ from 'lodash';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UsersService } from '@modules/users/users.service';
import { RolesService } from '@modules/roles/roles.service';
import { User } from '@modules/users/entities';
import { Role } from '@modules/roles/entities';
import { UserRO } from '@modules/users/users.dto';
import { User as UserInterface } from '@modules/users/interfaces/user.interface';

describe('UsersService', () => {
    let app: INestApplication;
    let usersService: UsersService;

    const userRole = new Role('user');
    userRole.id = 1;
    const adminRole = new Role('admin');
    adminRole.id = 2;

    const roles = {
        user: userRole,
        admin: adminRole
    };

    // mocked methods get reset before every test, this is more like an interface
    const mockUserRepository = {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn()
    };

    const mockRolesService = {
        findByName: jest.fn()
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository
                },
                {
                    provide: RolesService,
                    useValue: mockRolesService
                }
            ]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        usersService = module.get(UsersService);
    });

    afterEach(async () => {
        await app.close();
    });

    describe('create()', () => {
        let id: number = 1;

        afterEach(() => {
            id = 1;
        });

        it('should create user with USER role', async () => {
            const userRepositorySaveArgs: User[] = [];
            mockUserRepository.save = jest.fn((x: User) => {
                userRepositorySaveArgs.push(_.cloneDeep(x));
                // mock the saving itself - setting the object's ID
                if (!x.id) {
                    x.id = id;
                    id += 1;
                }
            });
            mockRolesService.findByName = jest.fn(() => [userRole]);

            const inputUser: UserInterface = {
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            // after assigning hash password
            const expectedFirstUser = {
                ...inputUser,
                password: expect.any(String)
            };

            // after assigning roles (ID is assigned in first save)
            const expectedSecondUser = {
                ...inputUser,
                id: 1,
                password: expect.any(String),
                roles: [userRole]
            };

            await usersService.create(inputUser);

            expect(mockUserRepository.save).toHaveBeenCalledTimes(2);
            // since in save(), the argument is mutated, spy.mock.calls point in both calls to the same object
            // = it shows them as they were in the last call - that's the reason for deep cloning the arguments in save() mock
            expect(userRepositorySaveArgs[0]).toEqual(expectedFirstUser);
            expect(userRepositorySaveArgs[1]).toEqual(expectedSecondUser);
        });

        it('should return created user without password', async () => {
            mockUserRepository.save = jest.fn((x: User) => {
                // mock the saving itself - setting the object's ID
                if (!x.id) {
                    x.id = id;
                    id += 1;
                }
            });
            mockRolesService.findByName = jest.fn(() => [userRole]);

            const inputUser: UserInterface = {
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };
            const expected = {
                ...inputUser,
                id: 1,
                roles: [userRole]
            };
            delete expected.password;

            const result: UserRO = await usersService.create(inputUser);

            expect(result).toEqual(expected);
        });
    });

    describe('findAll()', () => {
        it('should return users with roles and without passwords', async () => {
            mockUserRepository.find = jest.fn(() => ([
                new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: [adminRole]
                }),
                new User({
                    id: 2,
                    firstName: 'Jonathan',
                    surname: 'Davis',
                    email: 'jon.davis@contentry.org',
                    password: 'jondavis',
                    roles: [userRole]
                })
            ]));

            const result: UserRO[] = await usersService.findAll();

            expect(mockUserRepository.find).toBeCalledTimes(1);
            expect(result).toHaveLength(2);
            expect(result).toContainEqual({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                roles: [adminRole]
            });
            expect(result).toContainEqual({
                id: 2,
                firstName: 'Jonathan',
                surname: 'Davis',
                email: 'jon.davis@contentry.org',
                roles: [userRole]
            });
        });
        describe('should throw bad request exception when no users were found', () => {
            it(' - falsy array', async () => {
                mockUserRepository.find = jest.fn(() => null);

                await expect(usersService.findAll()).rejects.toThrow(BadRequestException);
            });
            it(' - empty array', async () => {
                mockUserRepository.find = jest.fn(() => []);

                await expect(usersService.findAll()).rejects.toThrow(BadRequestException);
            });
        });
    });

    describe('findByID()', () => {
        it('should return a user without password', async () => {
            const john = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick',
                roles: [adminRole]
            });
            mockUserRepository.findOne = jest.fn(() => john);

            const result: UserRO = await usersService.findByID(1);

            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
            expect(result).toEqual({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                roles: [adminRole]
            });
        });
        it('should throw bad request exception if user doesn\'t exist', async () => {
            mockUserRepository.findOne = jest.fn(() => null);

            await expect(usersService.findByID(1)).rejects.toThrow(BadRequestException);
            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
        });
    });

    describe('findByEmail()', () => {
        describe('should return a user', () => {
            const john = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick',
                roles: [adminRole]
            });

            it('with password', async () => {
                mockUserRepository.findOne = jest.fn(() => john);

                const result = await usersService.findByEmail('john.wick@contentry.org', true);
                expect(mockUserRepository.findOne).toBeCalledWith({
                    where: { email: 'john.wick@contentry.org' },
                    relations: ['roles']
                });
                expect(result).toEqual({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: [adminRole]
                });
            });
            it('without password - explicit parameter', async () => {
                mockUserRepository.findOne = jest.fn(() => john);

                const result = await usersService.findByEmail('john.wick@contentry.org', false);
                expect(mockUserRepository.findOne).toBeCalledWith({
                    where: { email: 'john.wick@contentry.org' },
                    relations: ['roles']
                });
                expect(result).toEqual({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    roles: [adminRole]
                });
            });
            it('without password - default parameter', async () => {
                mockUserRepository.findOne = jest.fn(() => john);

                const result = await usersService.findByEmail('john.wick@contentry.org');
                expect(mockUserRepository.findOne).toBeCalledWith({
                    where: { email: 'john.wick@contentry.org' },
                    relations: ['roles']
                });
                expect(result).toEqual({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    roles: [adminRole]
                });
            });
        });
        it('should return null if user doesn\'t exist', async () => {
            mockUserRepository.findOne = jest.fn(() => null);

            const user = await usersService.findByEmail('john.wick@contentry.org');

            expect(user).toBeNull();
            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { email: 'john.wick@contentry.org' },
                relations: ['roles']
            });
        });
    });

    describe('updateUser()', () => {
        const john = new User({
            id: 1,
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org',
            password: 'johnwick',
            roles: [adminRole]
        });

        it('should update user in database', async () => {
            // tests mutate the returned object = need to return deep clone of John
            mockUserRepository.findOne = jest.fn(() => _.cloneDeep(john));

            const data = {
                firstName: 'Jack',
                surname: 'King',
                email: 'jack.king@contentry.org'
            };
            await usersService.updateUser(1, data);

            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
            expect(mockUserRepository.save).toBeCalledWith({
                id: 1,
                firstName: 'Jack',
                surname: 'King',
                email: 'jack.king@contentry.org',
                password: 'johnwick',
                roles: [adminRole]
            });
        });
        it('should return updated user without password', async () => {
            mockUserRepository.findOne = jest.fn(() => _.cloneDeep(john));

            const data = {
                firstName: 'Jack',
                surname: 'King',
                email: 'jack.king@contentry.org'
            };
            const result = await usersService.updateUser(1, data);

            expect(result).toEqual({
                id: 1,
                firstName: 'Jack',
                surname: 'King',
                email: 'jack.king@contentry.org',
                roles: [adminRole]
            });
        });
        it('should return user even if nothing was updated', async () => {
            mockUserRepository.findOne = jest.fn(() => _.cloneDeep(john));
            const result = await usersService.updateUser(1, {});

            expect(result).toEqual({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                roles: [adminRole]
            });
        });
        it('should throw bad request exception if user was not found', async () => {
            mockUserRepository.findOne = jest.fn(() => null);

            await expect(usersService.updateUser(1, {})).rejects.toThrow(BadRequestException);
            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
            expect(mockUserRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('deleteUser()', () => {
        it('should remove user from database if it was found and return true', async () => {
            const john = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick',
                roles: [adminRole]
            });
            mockUserRepository.findOne = jest.fn(() => john);

            const result = await usersService.deleteUser(1);

            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
            expect(mockUserRepository.remove).toBeCalledWith({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick',
                roles: [adminRole]
            });
            expect(result).toBe(true);
        });
        it('should throw bad request exception if user was not found', async () => {
            mockUserRepository.findOne = jest.fn(() => null);

            await expect(usersService.deleteUser(1)).rejects.toThrow(BadRequestException);
            expect(mockUserRepository.findOne).toBeCalledWith({
                where: { id: 1 },
                relations: ['roles']
            });
            expect(mockUserRepository.remove).not.toHaveBeenCalled();
        });
    });

    describe('assignRole()', () => {
        describe('should assign role/s to user', () => {
            it('single role', async () => {
                mockRolesService.findByName = jest.fn(roleName => [roles[roleName]]);

                const john = new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });

                await usersService.assignRole(john, 'admin');

                expect(mockUserRepository.save).toHaveBeenCalledWith({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: [adminRole]
                });
            });
            it('multiple roles', async () => {
                mockRolesService.findByName = jest.fn(() => [userRole, adminRole]);

                const john = new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });

                await usersService.assignRole(john, ['user', 'admin']);

                expect(mockUserRepository.save).toHaveBeenCalledWith({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: expect.arrayContaining([userRole, adminRole])
                });
            });
            it('if he doesn\'t have the property', async () => {
                mockRolesService.findByName = jest.fn(roleName => [roles[roleName]]);

                const johnWithoutRoles = new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });
                delete johnWithoutRoles.roles;

                await usersService.assignRole(johnWithoutRoles, 'admin');

                expect(mockUserRepository.save).toHaveBeenCalledWith({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: [adminRole]
                });
            });
        });
        describe('should throw a bad request exception', () => {
            it('if single role doesn\'t exist', async () => {
                mockRolesService.findByName = jest.fn(() => null);

                const john = new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });

                await expect(usersService.assignRole(john, 'admin')).rejects.toThrow(BadRequestException);

                expect(mockUserRepository.save).not.toHaveBeenCalled();
            });
            it('if multiple roles don\'t exist', async () => {
                mockRolesService.findByName = jest.fn(() => null);

                const john = new User({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });

                await expect(usersService.assignRole(john, ['user', 'admin'])).rejects.toThrow(BadRequestException);

                expect(mockUserRepository.save).not.toHaveBeenCalled();
            });
        });
    });

    describe('removeRole()', () => {
        const john = new User({
            id: 1,
            firstName: 'John',
            surname: 'Wick',
            email: 'john.wick@contentry.org',
            password: 'johnwick',
            roles: [userRole, adminRole]
        });

        describe('should remove role/s from user', () => {
            it('single role', async () => {
                await usersService.removeRole(_.cloneDeep(john), 'user');

                expect(mockUserRepository.save).toHaveBeenCalledWith({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: [adminRole]
                });
            });
            it('multiple roles', async () => {
                await usersService.removeRole(_.cloneDeep(john), ['user', 'admin']);

                expect(mockUserRepository.save).toHaveBeenCalledWith({
                    id: 1,
                    firstName: 'John',
                    surname: 'Wick',
                    email: 'john.wick@contentry.org',
                    password: 'johnwick',
                    roles: []
                });
            });
        });
        it('should save user unchanged when he doesn\'t have any roles', async () => {
            const johnWithoutRoles = _.cloneDeep(john);
            johnWithoutRoles.roles = [];

            await usersService.removeRole(johnWithoutRoles, 'user');

            expect(mockUserRepository.save).toHaveBeenCalledWith({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick',
                roles: []
            });
        });
    });
});
