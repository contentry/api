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
import { AuthService } from '@modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('UsersService', () => {
    let app: INestApplication;
    let authService: AuthService;

    // "mock interfaces"
    const mockJwtService = {
    };

    const mockUsersService = {
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

        });
        it('returns access token and expiration time if credentials are correct', async () => {

        });
    });

    describe('findByEmailAndPass()', () => {
        it('returns null if user doesn\'t exist', async () => {

        });
        it('returns null if password doesn\'t match', async () => {

        });
        it('returns user if he exists and a correct password is provided', async () => {

        });
    });

    describe('validate()', () => {
        it('returns user if the payload email is his', async () => {

        });
        it('returns null if user with payload email doesn\'t exist', async () => {

        });
    });

    afterAll(async () => {
        await app.close();
    });
});
