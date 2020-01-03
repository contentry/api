import { IsEmail, Length } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class CreateUserIO {
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
