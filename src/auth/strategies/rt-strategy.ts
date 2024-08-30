import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //TODO: change secretOrKey to a more secure
      secretOrKey: 'rt-secret',
      passReqToCallback: true
    })
  }

  validate(req: Request, payload: any) {
    return payload;
  }
}