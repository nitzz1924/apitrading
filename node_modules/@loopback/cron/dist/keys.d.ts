import { BindingKey } from '@loopback/core';
import { CronComponent } from './cron.component';
/**
 * Binding keys used by this component.
 */
export declare namespace CronBindings {
    /**
     * Binding key for `CronComponent`
     */
    const COMPONENT: BindingKey<CronComponent>;
    /**
     * Namespace for cron jobs
     */
    const CRON_JOB_NAMESPACE = "cron.jobs";
}
