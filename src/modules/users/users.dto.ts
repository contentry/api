import { IsEmail, Length, IsOptional } from 'class-validator';
import { Field, ObjectType, InputType, ID } from 'type-graphql';
import { RoleRO } from '@modules/roles/roles.dto';

@InputType()
export class CreateUserDTO {
    @Field(type => String)
    @Length(1, 100)
    readonly firstName: string;

    @Field(type => String)
    @Length(1, 100)
    readonly surname: string;

    @Field(type => String)
    @IsEmail()
    readonly email: string;

    @Field(type => String)
    @Length(6, 50)
    readonly password: string;

    constructor(data: {
        firstName: string,
        surname: string,
        email: string,
        password: string
    }) {
        Object.assign(this, data);
    }
}

@InputType()
export class UpdateUserDTO {
    @Field(type => String, { nullable: true })
    @Length(1, 100)
    @IsOptional()
    readonly firstName?: string;

    @Field(type => String, { nullable: true })
    @Length(1, 100)
    @IsOptional()
    readonly surname?: string;

    @Field(type => String, { nullable: true })
    @IsEmail()
    @IsOptional()
    readonly email?: string;

    constructor(data: {
        firstName?: string,
        surname?: string,
        email?: string
    }) {
        Object.assign(this, data);
    }
}

@ObjectType()
export class UserRO {
    @Field(type => ID)
    readonly id: number;

    @Field(type => String)
    readonly firstName: string;

    @Field(type => String)
    readonly surname: string;

    @Field(type => String)
    readonly email: string;

    @Field(type => [RoleRO], { nullable: true })
    readonly roles?: RoleRO[];
}
