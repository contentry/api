import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginIO, LoginRO } from './dto';
import { User } from '@modules/users/interfaces';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Mutation(returns => LoginRO)
    async login(@Args('loginData') payload: LoginIO): Promise<LoginRO> {
        const user: User = { ...payload };
        return await this.authService.login(user);
    }

    @Mutation(returns => Boolean)
    async logout(): Promise<Boolean> {
        // TODO: add user's token to black list
        return true;
    }
}
