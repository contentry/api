import { Field, InputType } from 'type-graphql';

@InputType()
export class LoginIO {
    @Field(type => String)
    readonly email: string;
    @Field(type => String)
    readonly password: string;
}
