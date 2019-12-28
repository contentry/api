import * as _ from 'lodash';
import { Repository } from 'typeorm';
import { INestApplication } from '@nestjs/common';
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
    let userRepository: Repository<User>;
    const userRepositorySaveArgs: User[] = [];
    let id: number = 1;

    const userRole = new Role('user');
    userRole.id = 1;

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        save: jest.fn((x: User) => {
                            userRepositorySaveArgs.push(_.cloneDeep(x));
                            // mock the saving itself - setting the object's ID
                            // needed for some (not all) tests
                            if (!x.id) {
                                x.id = id;
                                id += 1;
                            }
                        })
                    }
                },
                {
                    provide: RolesService,
                    useValue: {
                        findByName: jest.fn(rolesName => [userRole])
                    }
                }
            ]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        usersService = module.get(UsersService);
        userRepository = module.get(getRepositoryToken(User));
    });

    describe('create()', () => {
        it('should create user with USER role', async () => {
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

            const spy = jest.spyOn(userRepository, 'save');

            await usersService.create(inputUser);

            expect(spy).toHaveBeenCalledTimes(2);
            // since in save(), the argument is mutated, spy.mock.calls point in both calls to the same object
            // = it shows them as they were in the last call - that's the reason for deep cloning the arguments in save() mock
            expect(userRepositorySaveArgs[0]).toEqual(expectedFirstUser);
            expect(userRepositorySaveArgs[1]).toEqual(expectedSecondUser);
        });

        it('should return created user without password', async () => {
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

    afterEach(() => {
        id = 1;
    });

    afterAll(async () => {
        await app.close();
    });
});
