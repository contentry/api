import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepository, Repository } from 'typeorm';
import * as supertest from 'supertest';

import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { RolesModule } from '@modules/roles/roles.module';
import { AuthResolver } from '@modules/auth/auth.resolver';
import { UsersResolver } from '@modules/users/users.resolver';
import { UsersService } from '@modules/users/users.service';
import { AuthService } from '@modules/auth/auth.service';
import { GqlAuthGuard } from '@modules/auth/guards';
import { User } from '@modules/users/entities';
import { User as UserInterface } from '@modules/users/interfaces';
import { makeGQLHelperMethods } from '@test/helpers';

@Resolver()
class TestResolver {
    @Query(returns => Boolean)
    test() {
        return true;
    }
}

describe('GqlAuthGuard', () => {
    let app: INestApplication;
    let userRepository: Repository<User>;
    let usersService: UsersService;
    let authService: AuthService;

    const userInfo: UserInterface = {
        firstName: 'John',
        surname: 'Wick',
        email: 'john.wick@contentry.org',
        password: 'johnwick'
    };

    let assertQueryThrowsUnauthorized: (query: string) => Promise<void>;
    let prepareGQLRequest: (accessToken?: string) => supertest.Test;

    beforeEach(async () => {
        // essentially E2E test on the entire app but with mock schema and resolver and GLOBALLY applied GqlAuthGuard (to make sure the query is guarded)
        // I haven't been able to make a completely dummy app and this works
        const module = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot(),
                AuthModule,
                UsersModule,
                RolesModule,
                GraphQLModule.forRoot({
                    typeDefs: 'type Query { test: Boolean! }',
                    debug: true,
                    context: ({ req }) => ({ req })
                })
            ],
            providers: [
                TestResolver,
                {
                    provide: APP_GUARD,
                    useClass: GqlAuthGuard
                }
            ]
        })
            .overrideProvider(AuthResolver).useValue({})
            .overrideProvider(UsersResolver).useValue({})
            .compile();
        app = module.createNestApplication();
        await app.init();

        ({
            assertQueryThrowsUnauthorized,
            prepareGQLRequest
        } = makeGQLHelperMethods(app));

        userRepository = getRepository(User);
        usersService = module.get(UsersService);
        authService = module.get(AuthService);

        // create a user
        await usersService.create(userInfo);
    });

    afterEach(async () => {
        await userRepository.query('DELETE FROM users');
        await app.close();
    });

    it('should throw a fake 401 Unauthorized response on a not logged request', async () => {
        await assertQueryThrowsUnauthorized('query { test }');
    });
    it('should pass a request if it\'s authorized', async () => {
        const { accessToken } = await authService.login({
            email: userInfo.email,
            password: userInfo.password
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
