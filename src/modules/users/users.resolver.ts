import { BadRequestException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '@modules/auth/guards/auth.guard';
import { RolesGuard } from '@modules/roles/guards/roles.guard';
import { Roles } from '@modules/roles/roles.decorator';
import { constants as rolesConstants } from '@utils/helpers/roles.helper';
import { UsersService } from './users.service';
import { CreateUserDTO, UpdateUserDTO, UserRO } from './users.dto';
import { User as CurrentUser } from './users.decorator';
import { User, UpdateUser as UpdateUserInterface } from './interfaces/user.interface';

@Resolver(of => UserRO)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) {}

    @Mutation(returns => UserRO)
    createUser(@Args('data') data: CreateUserDTO): Promise<UserRO> {
        const user: User = { ...data };
        return this.usersService.create(user);
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Query(returns => [UserRO])
    async allUsers(): Promise<UserRO[]> {
        return this.usersService.findAll();
    }

    @UseGuards(GqlAuthGuard)
    @Query(returns => UserRO)
    async currentUser(@CurrentUser() currentUser: User): Promise<UserRO> {
        return this.usersService.findByID(currentUser.id);
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Mutation(returns => UserRO)
    updateUser(@Args('id') userId: number,
               @Args('data') data: UpdateUserDTO): Promise<UserRO> {
        return this.usersService.updateUser(userId, data);
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Mutation(returns => Boolean)
    deleteUser(@Args('id') userId: number): Promise<boolean> {
        return this.usersService.deleteUser(userId);
    }
}
