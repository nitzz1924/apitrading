import { Component, Getter, LifeCycleObserver } from '@loopback/core';
import { CronJob } from './types';
/**
 * The CronComponent manages cron jobs. It serves as an extension point for
 * cron jobs.
 */
export declare class CronComponent implements Component, LifeCycleObserver {
    readonly getJobs: Getter<CronJob[]>;
    constructor(getJobs: Getter<CronJob[]>);
    start(): Promise<void>;
    stop(): Promise<void>;
}
