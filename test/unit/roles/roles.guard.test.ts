import { INestApplication, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Query, Resolver } from '@nestjs/graphql';
import { APP_GUARD } from '@nestjs/core';
import { GqlAuthGuard } from '@modules/auth/guards/auth.guard';
import { getRepository, Repository } from 'typeorm';
import { User } from '@modules/users/entities';
import { UsersService } from '@modules/users/users.service';
import { AuthService } from '@modules/auth/auth.service';
import { User as UserInterface } from '@modules/users/interfaces/user.interface';
import { makeGQLHelperMethods } from '../../helpers';
import * as supertest from 'supertest';
import { AppModule } from '@app/app.module';
import { RolesGuard } from '@modules/roles/guards/roles.guard';
import { Roles } from '@modules/roles/roles.decorator';
import { constants } from '@utils/helpers/roles.helper';

@Resolver()
class TestResolver {
    // authenticated AND admin
    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(constants.ADMIN)
    @Query(returns => Boolean)
    test() {
        return true;
    }
}

describe('RolesGuard', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;
    let authService: AuthService;

    const carlInfo: UserInterface = {
        firstName: 'Carl',
        surname: 'Johnson',
        email: 'carl.johnson@contentry.org',
        password: 'carljohnson'
    };
    const johnInfo: UserInterface = {
        firstName: 'John',
        surname: 'Wick',
        email: 'john.wick@contentry.org',
        password: 'johnwick'
    };

    let assertQueryThrowsUnauthorized: (query: string) => Promise<void>;
    let assertQueryThrowsForbidden: (query: string, accessToken: string) => Promise<void>;
    let prepareGQLRequest: (accessToken?: string) => supertest.Test;

    beforeEach(async () => {
        // essentially E2E test on the entire app but with added dummy query which is protected by GqlAuthGuard AND RolesGuard (with @Roles('admin'))
        // I haven't been able to make a completely dummy app and this works
        const module = await Test.createTestingModule({
            imports: [AppModule],
            providers: [TestResolver]
        }).compile();
        app = module.createNestApplication();
        await app.init();

        ({
            assertQueryThrowsUnauthorized,
            assertQueryThrowsForbidden,
            prepareGQLRequest
        } = makeGQLHelperMethods(app));

        userRepository = getRepository(User);
        usersService = module.get(UsersService);
        authService = module.get(AuthService);

        // create a user
        await usersService.create({ ...carlInfo });
        await usersService.create({ ...johnInfo });
        const createdUser = await usersService.findByEmail(johnInfo.email, true);
        await usersService.assignRole(createdUser, constants.ADMIN);
    });

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
        await app.close();
    });

    it('should throw a fake 401 Unauthorized response on a not logged request', async () => {
        await assertQueryThrowsUnauthorized('query { test }');
    });
    it('should throw a fake 403 Forbidden response on an admin-only query if user is not an admin', async () => {
        const { accessToken } = await authService.login({
            email: carlInfo.email,
            password: carlInfo.password
        });

        await assertQueryThrowsForbidden('query { test }', accessToken);
    });
    it('should pass a request if it\'s authorized and an admin', async () => {
        const { accessToken } = await authService.login({
            email: johnInfo.email,
            password: johnInfo.password
        });

        const res = await prepareGQLRequest(accessToken)
            .send({ query: 'query { test }' });

        expect(res.status).toEqual(200);
        expect(res.body).toMatchObject({
            data: {
                test: true
            }
        });
    });
});
