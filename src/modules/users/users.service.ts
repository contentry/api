import * as _ from 'lodash';
import {
    Injectable,
    InternalServerErrorException,
    BadRequestException
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RolesService } from '@modules/roles/roles.service';
import { constants } from '@utils/helpers/roles.helper';
import { PasswordsHelper } from '@utils/helpers/passwords.helper';
import { User } from './entities';
import { User as UserInterface, UpdateUser as UpdateUserInterface } from './interfaces/user.interface';
import { UserRO } from './users.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        private readonly rolesService: RolesService
    ) {}

    async create(user: UserInterface): Promise<UserRO> {
        const newUser = new User(user);
        newUser.password = await PasswordsHelper.hash(user.password);

        await this.usersRepository.save(newUser);
        await this.assignRole(newUser, [constants.USER]);
        return _.omit(newUser, ['password']);
    }

    async findAll(): Promise<UserRO[]> {
        const users = await this.usersRepository.find({
            relations: ['roles']
        });
        return users.map(user => _.omit(user, ['password']));
    }

    async findByID(id: number): Promise<UserRO> {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['roles']
        });

        return _.omit(user, ['password']);
    }

    async findByEmail(email: string, withPass: boolean = false): Promise<User> {
        let user: any = await this.usersRepository.findOne({
            where: { email },
            relations: ['roles']
        });

        if (!withPass) {
            user = _.omit(user, ['password']);
        }

        return user;
    }

    // TODO: update roles too?
    async updateUser(id: number, data: UpdateUserInterface): Promise<UserRO> {
        const existingUser = await this.usersRepository.findOne({
            where: { id },
            relations: ['roles']
        });

        if (!existingUser) {
            throw new BadRequestException('User not found');
        }

        Object.assign(existingUser, data);
        await this.usersRepository.save(existingUser);
        return _.omit(existingUser, ['password']);
    }

    async deleteUser(userId: number): Promise<boolean> {
        const existingUser = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['roles']
        });

        if (!existingUser) {
            return false;
        }

        await this.usersRepository.remove(existingUser);
        return true;
    }

    async assignRole(user: User, rolesName: string | string[]): Promise<any> {
        const roles = await this.rolesService.findByName(rolesName);

        if (!roles || !roles.length) {
            return new BadRequestException('Role(s) not found.');
        }

        if (!user.roles) {
            user.roles = [];
        }

        for (const role of roles) {
            user.roles.push(role);
        }

        await this.usersRepository.save(user);
    }

    async removeRole(user: User, rolesName: string | string[]): Promise<any> {
        if (user.roles && user.roles.length) {
            const roles = Array.isArray(rolesName) ? rolesName : [rolesName];
            user.roles = user.roles.filter(role => !roles.includes(role.name));
        }
        await this.usersRepository.save(user);
    }
}
