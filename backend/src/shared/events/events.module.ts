import { Global, Module } from "@nestjs/common";
import { DOMAIN_EVENT_PUBLISHER } from "../constants/injection-tokens";
import { NestDomainEventPublisher } from "./nest-domain-event-publisher";

@Global()
@Module({
  providers: [
    NestDomainEventPublisher,
    { provide: DOMAIN_EVENT_PUBLISHER, useExisting: NestDomainEventPublisher },
  ],
  exports: [NestDomainEventPublisher, DOMAIN_EVENT_PUBLISHER],
})
export class EventsModule {}
