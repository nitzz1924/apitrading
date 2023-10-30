'use strict';
var loopback = require('loopback');
var mongoObj = require('mongodb');
var _ = require('lodash');
//var lbContext = require('loopback-context');
exports['default'] = function (Model, options) {
    Model.beforeRemote('**', function (ctx, unused, next) {
        if (!ctx.req.headers) return next();
        if (ctx.args.options) {
            ctx.args.options.currentTenantCode = ctx.req.headers["x-tenant-code"];
        }
        next();
    })
    Model.observe('access', function (ctx, next) {
        var tenantId = (ctx.options.currentTenantCode) ? ctx.options.currentTenantCode : "ADB";
        if (!ctx.query.where) ctx.query.where = {};
        ctx.query.where.tenantCode = tenantId;
        next();
    });
    Model.observe('before save', function (ctx, next) {
        if (_.get(ctx.instance, "tenantCode")) {
            next();
            return
        }
        if (ctx.isNewInstance) {

            ctx.instance.tenantCode = (ctx.options.currentTenantCode) ? ctx.options.currentTenantCode : "ADB";
        }
        next();
    });
};

module.exports = exports['default'];