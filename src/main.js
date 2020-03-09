"use strict"
var Vue = require('vue').default

var VueRouter = require('vue-router').default
var sync = require('vuex-router-sync').sync
var VTooltip = require('v-tooltip')

Vue.config.productionTip = false
Vue.use(VueRouter)
Vue.use(VTooltip)

var store = require('./lib/vuex/store.js');

var App = Vue.extend(require('./app.vue'));

var router = new VueRouter({
    mode: 'history',
    saveScrollPosition: true,
    routes: [
        {
            path: '/',
            name: 'mainPage',
            component: require('./views/index.vue')
        },
        {
            path: '/bugzilla',
            name: 'bugzilla',
            component: require('./views/bugzilla.vue')
        },
        {
            path: '/donate',
            name: 'donate',
            component: require('./views/donate.vue')
        },
        {
            path: '/analytics',
            component: require('./views/analytics/index.vue'),
            children: [
                {
                    path: 'realtime',
                    name: 'analyticsRealtime',
                    component: require('./views/analytics/realtime.vue')
                },
                {
                    path: ':termId?/:courseNum?',
                    name: 'analyticsCourse',
                    component: require('./views/analytics/course.vue')
                }
            ]
        },
        {
            path: '/explain',
            component: require('./views/explain/index.vue'),
            children: [
                {
                    path: '',
                    name: 'explainText',
                    component: require('./views/explain/text.vue')
                },
                {
                    path: 'gif',
                    name: 'explainGif',
                    component: require('./views/explain/gif.vue')
                },
                {
                    path: 'privacy',
                    name: 'explainPrivacy',
                    component: require('./views/explain/privacy.vue')
                },
                {
                    path: 'opensource',
                    name: 'openSource',
                    component: require('./views/explain/opensource.vue')
                }
            ]
        },
        {
            path: '/calendar',
            redirect: '/planner'
        },
        {
            path: '/calendar/:termId',
            redirect: '/planner/:termId'
        },
        {
            path: '/planner',
            component: require('./views/planner/index.vue'),
            children: [
                {
                    path: '',
                    name: 'termsList',
                    component: require('./views/planner/termsList.vue')
                },
                {
                    path: ':termId',
                    name: 'term',
                    component: require('./views/planner/term.vue')
                },
                {
                    path: ':termId/list',
                    name: 'viewList',
                    component: require('./views/planner/list.vue')
                }
            ]
        },
        {
            path: '/enrollment',
            component: require('./views/enrollment/index.vue'),
            children: [
                {
                    path: '',
                    name: 'enrollHelper',
                    component: require('./views/enrollment/helper.vue')
                },
                {
                    path: 'manage',
                    name: 'enrollManage',
                    component: require('./views/enrollment/manage.vue')
                }
            ]
        },
        {
            path: '/advisory',
            component: require('./views/advisory/index.vue'),
            children: [
                {
                    path: '',
                    name: 'advMenu',
                    component: require('./views/advisory/menu.vue')
                },
                {
                    path: 'planner',
                    name: 'advPlanner',
                    component: require('./views/advisory/planner.vue')
                }
                /*,
                {
                    path: 'volunteer',
                    name: 'reqVolunteer',
                    component: require('./views/req/volunteer.vue')
                },
                {
                    path: 'volunteer/:type?/:name?',
                    name: 'reqVolunteerForm',
                    component: require('./views/req/volunteer.vue')
                }*/
            ]
        }
    ]
})

require('./lib/registerComponents.js')(Vue)

require('./lib/init.js')(store, router).then(function() {
    sync(store, router);
    var vm = new App({
        router: router,
        store: store
    }).$mount('#app')
    window.App = vm;
})
