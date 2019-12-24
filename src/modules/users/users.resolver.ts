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
    createUser(@Args('createUserData') payload: CreateUserDTO): Promise<UserRO> {
        const user: User = { ...payload };
        return this.usersService.create(user);
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Query(returns => [UserRO])
    async allUsers(): Promise<UserRO[]> {
        const users = await this.usersService.findAll();

        if (users && users.length > 0) {
            return users;
        }

        throw new BadRequestException('No users found.');
    }

    @UseGuards(GqlAuthGuard)
    @Query(returns => UserRO)
    async currentUser(@CurrentUser() currentUser: User): Promise<UserRO> {
        const user = await this.usersService.findByID(currentUser.id);

        if (user) {
            return user;
        }

        throw new BadRequestException('User not found.');
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Mutation(returns => UserRO)
    updateUser(@Args('updateUserData') payload: UpdateUserDTO): Promise<UserRO> {
        const user: UpdateUserInterface = { ...payload };
        return this.usersService.updateUser(user);
    }

    @UseGuards(GqlAuthGuard, RolesGuard)
    @Roles(rolesConstants.ADMIN)
    @Mutation(returns => Boolean)
    deleteUser(@Args('id') userId: number): Promise<boolean> {
        return this.usersService.deleteUser(userId);
    }
}
