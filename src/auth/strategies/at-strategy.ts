import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

type JwtPayload = {
  email: string;
  sub: number;
  iat: number;
  exp: number;
}

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //TODO: change secretOrKey to a more secure
      secretOrKey: 'at-secret'
    })
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
