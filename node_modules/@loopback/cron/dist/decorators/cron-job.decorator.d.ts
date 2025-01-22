import { BindingSpec } from '@loopback/core';
/**
 * `@cronJob` decorates a cron job provider class
 *
 * @example
 * ```ts
 * @cronJob()
 * class CronJobProvider implements Provider<CronJob> {
 *   constructor(@config() private jobConfig: CronJobConfig = {}) {}
 *   value() {
 *     // ...
 *   }
 * }
 * ```
 * @param specs - Extra binding specs
 */
export declare function cronJob(...specs: BindingSpec[]): ClassDecorator;
