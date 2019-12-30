import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { UsersService } from '@modules/users/users.service';
import { User } from '@modules/users/entities';
import { User as UserInterface } from '@modules/users/interfaces/user.interface';
import { AuthService } from '@modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordsHelper } from '@utils/helpers/passwords.helper';

describe('AuthService', () => {
    let app: INestApplication;
    let authService: AuthService;

    // "mock interfaces"
    const mockJwtService = {
        sign: jest.fn()
    };

    const mockUsersService = {
        findByEmail: jest.fn((email, withPass) => {
            console.log('default findByEmail mock');
            return null;
        })
    };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: JwtService,
                    useValue: mockJwtService
                },
                {
                    provide: UsersService,
                    useValue: mockUsersService
                }
            ]
        }).compile();
        app = module.createNestApplication();
        await app.init();
        authService = module.get(AuthService);
    });

    describe('login()', () => {
        it('throws bad request exception if credentials are wrong', async () => {
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('login 1 findByEmail');
                return null;
            });
            const spyFindByEmailAndPass = jest.spyOn(authService, 'findByEmailAndPass');

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            await expect(authService.login(user)).rejects.toThrow(BadRequestException);
            expect(spyFindByEmailAndPass).toHaveBeenCalledWith({
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            expect(mockUsersService.findByEmail).toHaveBeenCalledWith('john.wick@contentry.org', true);
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });
        it('returns access token and expiration time if credentials are correct', async () => {
            const existingUser = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('login 2 findByEmail');
                return existingUser;
            });

            mockJwtService.sign = jest.fn(() => 'token');

            const originalPasswordCompare = PasswordsHelper.compare;
            const mockPasswordCompare = jest.fn(() => Promise.resolve(true));
            PasswordsHelper.compare = mockPasswordCompare;

            const spyFindByEmailAndPass = jest.spyOn(authService, 'findByEmailAndPass');

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.login(user);

            expect(result).toEqual({
                accessToken: 'token',
                expiresIn: 3600
            });
            expect(spyFindByEmailAndPass).toHaveBeenCalledWith({
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            expect(mockUsersService.findByEmail).toHaveBeenCalledWith('john.wick@contentry.org', true);
            expect(mockPasswordCompare).toHaveBeenCalledWith('johnwick', existingUser.password);
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org'
            });

            PasswordsHelper.compare = originalPasswordCompare;
        });
    });

    describe('findByEmailAndPass()', () => {
        it('returns null if user doesn\'t exist', async () => {
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('findByEmailAndPass 1 findByEmail');
                return null;
            });

            const spyPasswordsHelperCompare = jest.spyOn(PasswordsHelper, 'compare');

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toBeNull();
            expect(spyPasswordsHelperCompare).not.toHaveBeenCalled();
        });
        it('returns null if password doesn\'t match', async () => {
            const mockUser = new User({
                password: 'babayaga'
            });
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('findByEmailAndPass 2 findByEmail');
                return mockUser;
            });

            const originalPasswordCompare = PasswordsHelper.compare;
            const mockPasswordCompare = jest.fn(() => Promise.resolve(false));
            PasswordsHelper.compare = mockPasswordCompare;

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toBeNull();
            expect(mockPasswordCompare).toHaveBeenCalledWith('johnwick', mockUser.password);
            PasswordsHelper.compare = originalPasswordCompare;
        });
        it('returns user if he exists and a correct password is provided', async () => {
            const existingUser = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('findByEmailAndPass 3 findByEmail');
                return existingUser;
            });

            const originalPasswordCompare = PasswordsHelper.compare;
            const mockPasswordCompare = jest.fn(() => Promise.resolve(true));
            PasswordsHelper.compare = mockPasswordCompare;

            const user: UserInterface = {
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            };

            const result = await authService.findByEmailAndPass(user);

            expect(result).toEqual({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org',
                password: 'johnwick'
            });
            expect(mockPasswordCompare).toHaveBeenCalledWith('johnwick', existingUser.password);
            PasswordsHelper.compare = originalPasswordCompare;
        });
    });

    describe('validate()', () => {
        it('returns user if the payload email is his', async () => {
            const email = 'john.wick@contentry.org';
            const expectedUser = new User({
                id: 1,
                firstName: 'John',
                surname: 'Wick',
                email: 'john.wick@contentry.org'
            });
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('validate 1 findByEmail');
                return expectedUser;
            });

            const user = await authService.validate({ email });
            expect(user).toEqual(expectedUser);
        });
        it('returns null if user with payload email doesn\'t exist', async () => {
            mockUsersService.findByEmail = jest.fn((email, withPass) => {
                console.log('validate 2 findByEmail');
                return null;
            });

            const user = await authService.validate({
                email: 'john.wick@contentry.org'
            });
            expect(user).toBeNull();
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
