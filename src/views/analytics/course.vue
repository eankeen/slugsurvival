<template>
    <div>
        <div class="overflow-hidden bg-white rounded mb2" v-show="ready">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Course Opening Analytics: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        You can check the historical enrollment data of a course.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable block"><i>Currently we have the data until {{ dropDeadline }}: </i></span>
                    <select class="col col-6 p1 ml1 h6 block" id="quarters"></select>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="md-flex">
                            <div class="p1 flex m1 h6 white bold clickable btn-outline" v-bind:style="{ backgroundColor: colorMap.searchAnything }" v-on:click.prevent.stop="showSearchModal"><i class="fa fa-search fa-lg">&nbsp;</i>search anything</div>
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <hr class="mb2" v-show="ready"/>
        <div class="overflow-scroll bg-white rounded mb2" v-show="ready && !route.params.termId && !route.params.courseNum">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Most Compacted Classes: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        "Make Enrollment Great Again" - Show Recent Top:
                        <template v-for="num in tops">
                            <a class="clickable" v-bind:class="{ 'black': top === num }" @click="top = num" >{{ num }}</a>&nbsp;
                        </template>
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable"><i>Data for {{ termName }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="overflow-hidden" v-show="compacted.length > 0">
                            <table class="table-light">
                                <thead class="bg-silver h6">
                                    <th>Course</th>
                                    <th>Excess Demand</th>
                                    <th>Waitlisted</th>
                                    <th>Enrolled / Capacity</th>
                                </thead>
                                <tbody class="h5">
                                    <tr class="clickable" v-on:click.prevent.stop="openAnalytics(result.course)" v-for="result in compacted.slice(0, top)">
                                        <td class="nowrap">{{ result.course.c }} - {{ result.course.s }}</td>
                                        <td class="nowrap bold">{{ (result.ratio * 100).toPrecision(4) + '%' }}</td>
                                        <td class="nowrap italic">{{ result.seats.waitTotal }}</td>
                                        <td class="nowrap">{{ result.seats.enrolled }} / {{ result.seats.cap }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-show="compacted.length === 0">
                            No results.
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <div class="overflow-scroll bg-white rounded mb2" v-show="ready && !route.params.termId && !route.params.courseNum">
			<div class="m0 p1">
				<div class="clearfix">
					<span class="btn black h4">Top 10 Classes in the Last Hour: </span>
				</div>
				<div class="clearfix">
					<span class="ml1 btn black h5 muted not-clickable">
                        Because the Hunger Game is real.
                    </span>
				</div>
			</div>
			<div class="m0 p1 border-top">
                <div class="clearfix">
                    <span class="btn black h5 not-clickable"><i>Data for {{ termName }}: </i></span>
				</div>
                <div class="m0 p1">
    				<div class="clearfix">
                        <div class="overflow-hidden" v-show="heat.length > 0">
                            <table class="table-light">
                                <thead class="bg-silver h6">
                                    <th>Course</th>
                                    <th>Changes</th>
                                </thead>
                                <tbody class="h5">
                                    <tr class="clickable" v-on:click.prevent.stop="openAnalytics(result.course)" v-for="result in heat">
                                        <td class="nowrap">{{ result.course.c }} - {{ result.course.s }}</td>
                                        <td class="nowrap">{{ result.count }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-show="heat.length === 0">
                            No results.
                        </div>
    				</div>
                </div>
			</div>
		</div>
        <search :show="searchModal" :resetOnShow="true" v-on:close="searchModal = false" :callback="openAnalytics" :selected-term-id="termCode"></search>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-if="ready && graphDataReady && graphData.length > 0">
            <div class="m0 p0">
                <div class="clearfix">
                    <div v-bind:id="canvasId"></div>
                    <graph :canvas-id="canvasId" :graph-data="graphData" :graph-title="'Time v Seats: ' + course.c + ' - ' + course.n"></graph>
                </div>
            </div>
        </div>
        <div class="overflow-hidden bg-white rounded mb2 clearfix" v-for="(section, index) in sectionsData" v-if="ready && graphDataReady && sectionsData.length > 0">
            <div class="m0 p0">
                <div class="clearfix">
                    <div v-bind:id="sectionsCanvasId[index]"></div>
                    <graph :section="true ":canvas-id="sectionsCanvasId[index]" :graph-data="section" :graph-title="'Section ' + section[0].sec"></graph>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
var config = require('../../../config')
var helper = require('../../lib/vuex/helper')
var request = require('superagent')
var ss = require('simple-statistics')

var termsToApplyBias = [
    '2190'
]

module.exports = {
    data: function() {
        return {
            ready: false,
            graphDataReady: true,
            searchModal: false,
            dropDeadline: null,
            canvasId: null,
            course: {},
            availableTerms: [],
            sectionsData: [],
            sectionsCanvasId: [],
            graphData: [],
            heat: [],
            compacted: [],
            selectizeRef: null,
            top: 10,
            tops: [
                10,
                20,
                50
            ],
            heatTimer: null,
            termCode: null
        }
    },
    computed: {
        alert: function() {
            return this.$store.getters.alert;
        },
        route: function() {
            return this.$store.getters.route;
        },
        flatCourses: function() {
            return this.$store.getters.flatCourses
        },
        termsList: function() {
            return this.$store.getters.termsList
        },
        termDates: function() {
            return this.$store.getters.termDates
        },
        colorMap: function() {
            return this.$store.getters.colorMap;
        },
        termName: function() {
            return this.$store.getters.termName;
        }
    },
    watch: {
        'route': function(val, oldVal) {
            if (!this.ready) return;
            this.$nextTick(function() {
                this.canvasId = null;
                this.graphData = [];
                this.sectionsData = [];
                this.sectionsCanvasId = [];
                this.$store.dispatch('hideSpinner')
                this.$nextTick(function() {
                    return this.loadGraph({
                        termId: this.route.params.termId || this.termCode,
                        courseNum: this.route.params.courseNum
                    })
                })
            })
        },
        'termCode': function(val, oldVal) {
            if (!this.ready) return;
            this.termCode = val;
            this.$router.push({ name: 'analyticsCourse' })
            this.switchTerm(oldVal);
        }
    },
    methods: {
        applyBias: function(bias, data) {
            return new Bluebird(function(resolve, reject) {
                switch (bias) {
                    case 'ckMeans':
                    var timestamps = data.map(function(obj) {
                        return obj.date
                    })
                    var timestampIndexHashMap = data.reduce(function(hashMap, obj, index) {
                        hashMap[obj.date] = index
                        return hashMap
                    }, {})
                    var segments = ss.ckmeans(timestamps, 2)
                    console.log(segments)
                    var smallestSegment = segments.reduce((obj, segment, index) => {
                        if (segment.length < obj.size) obj = {
                            index: index,
                            size: segment.length
                        }
                        return obj
                    }, {
                        index: -1,
                        size: 999999999999
                    })
                    if (smallestSegment.index !== -1) {
                        data.splice(timestampIndexHashMap[segments[smallestSegment.index][0]], 1)
                    }
                    resolve(data)
                    break;
                    default:
                    resolve(data);
                    break
                }
            })
        },
        showSearchModal: function() {
            this.searchModal = true;
            setTimeout(function() {
                document.getElementsByClassName('search-box')[0].focus();
            }, 75);
        },
        openAnalytics: function(course) {
            this.searchModal = false;
            this.graphDataReady = false;
            this.$router.push({ name: 'analyticsCourse', params: {
                termId: this.termCode,
                courseNum: course.num
            }})
        },
        makeid: function() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for( var i=0; i < 5; i++ )
                text += possible.charAt(Math.floor(Math.random() * possible.length));

            return text;
        }, // http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
        loadGraph: function(params) {
            if (!params.termId || !params.courseNum) return;
            var self = this;
            var bias = 'nobias'
            var applyBias = termsToApplyBias.indexOf(params.termId) !== -1
            if (applyBias === true) {
                console.log('Applying ckMeans to term', params.termId)
                bias = 'ckMeans'
            }
            self.$store.dispatch('showSpinner')
            self.graphDataReady = false;
            this.canvasId = this.makeid();
            self.graphData = [];
            return request.get(config.trackingURL + '/fetch?termId=' + params.termId + '&courseNum=' + params.courseNum)
            .ok(function(res) {
                return true
            })
            .then(function(res) {
                return res.body
            })
            .then(function(res) {
                if (typeof self.$store.state.termDates[self.termCode] !== 'undefined') {
                    var start = self.$store.state.termDates[self.termCode].start;
                    var monitorStart = new Date(start);
                    monitorStart.setDate(monitorStart.getDate() - helper.delta(self.termCode).enrollment);
                }
                if (res.ok !== true) {
                    if (res.message && res.message.indexOf('not tracked') !== -1) {
                        if (typeof monitorStart === 'undefined') {
                            return self.alert.error('This term is not yet being tracked, please check again later.')
                        }else{
                            return self.alert.error('This term is not yet being tracked, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                        }
                    }else{
                        console.log(res)
                        return self.alert.error('An error has occurred');
                    }
                }
                var rawData = res.results
                if (rawData && rawData.length === 0) {
                    if (typeof monitorStart === 'undefined') {
                        return self.alert.error('No data found.')
                    }else{
                        return self.alert.error('No data found, please check again after ' + moment(monitorStart).format('YYYY-MM-DD'))
                    }
                }
                return self.applyBias(bias, rawData)
                .then(function(data) {
                    var numOfSections = (data[0] ? data[0].sections.length  : 0);
                    if (numOfSections > 0) {
                        for (var i = 0, length = data.length; i < length; i++) {
                            for (var j = 0; j < numOfSections; j++) {
                                if (typeof self.sectionsData[j] === 'undefined') {
                                    self.sectionsData[j] = [];
                                }
                                if (!data[i] ||
                                    !data[i].sections ||
                                    !data[i].sections[j]) continue;
                                self.sectionsCanvasId[j] = self.makeid();
                                self.sectionsData[j].push(Object.assign({
                                    date: data[i].date
                                }, data[i].sections[j]))
                            }
                        }
                    }
                    self.graphData = data.map(function(result) {
                        delete result.sections
                        return result
                    })
                    self.course = self.flatCourses[params.termId][params.courseNum];
                })
            })
            .then(function() {
                self.graphDataReady = true;
                self.$store.dispatch('hideSpinner')
            })
        },
        fetchHeat: function() {
            var self = this;
            return request.get(config.trackingURL + '/heat?termId=' + self.termCode + '&period=3600')
            .then(function(res) {
                return res.body
            })
            .then(function(res) {
                if (res && res.ok === true && res.results && res.results.length > 0) self.heat = res.results.map(function(obj) {
                    if (!self.flatCourses[self.termCode]) return;
                    if (!self.flatCourses[self.termCode][obj.group]) return;
                    return {
                        course: self.flatCourses[self.termCode][obj.group],
                        count: obj.reduction
                    }
                }).slice(0, 10);
                else self.heat = [];
            })
        },
        fetchCompacted: function() {
            var self = this;
            return request.get(config.trackingURL + '/compacted?termId=' + self.termCode)
            .then(function(res) {
                return res.body
            })
            .then(function(res) {
                if (res && res.ok === true && res.results && res.results.length > 0) self.compacted = res.results.filter(function(obj) {
                    if (obj.ratio > 1) return true
                    else return false
                }).map(function(obj) {
                    if (!self.flatCourses[self.termCode]) return;
                    if (!self.flatCourses[self.termCode][obj.courseNum]) return;
                    return {
                        course: self.flatCourses[self.termCode][obj.courseNum],
                        seats: {
                            avail: obj.avail,
                            cap: obj.cap,
                            enrolled: obj.enrolled,
                            waitCap: obj.waitCap,
                            waitTotal: obj.waitTotal
                        },
                        ratio: obj.ratio - 1
                    }
                })
                else self.compacted = [];
            })
        },
        switchTerm: function(oldTermCode) {
            var self = this;
            self.dropDeadline = '...'
            self.heat = []
            self.compacted = []
            self.$store.commit('setTermName', null)
            if (!!oldTermCode) self.$store.commit('emptyTerm', oldTermCode)

            self.$store.dispatch('showSpinner')
            self.graphDataReady = true;
            return self.$store.dispatch('fetchTermCourses', self.termCode)
            .then(self.fetchHeat)
            .then(self.fetchCompacted)
            .then(function() {
                self.$store.commit('setTermName', self.$store.getters.termsList[self.termCode])
                var startDate = self.termDates[self.termCode]
                if (startDate.start === null) return false;
                else return self.$store.dispatch('calculateDropDeadline', self.termCode)
            })
            .then(function(deadline) {
                if (deadline === false) {
                    self.dropDeadline = '(Not Available)'
                }else{
                    self.dropDeadline = moment(deadline).format('YYYY-MM-DD');
                }
                self.ready = true;
                if (!self.route.params.courseNum) return;
                return self.loadGraph({
                    termId: self.termCode,
                    courseNum: self.route.params.courseNum
                })
            })
            .then(function() {
                self.$store.dispatch('hideSpinner')
            })
        },
        initSelectize: function() {
            var self = this;
            this.selectizeRef = $('#quarters').selectize({
                options: self.availableTerms.map(function(term) {
                    return { text: term.name, value: term.code }
                }),
                placeholder: 'select a quarter...',
                dropdownParent: "body",
                hideSelected: true,
                onChange: function(val) {
                    self.termCode = val;
                },
                render: {
                    option: function(item, escape) {
                        return '<div class="h6">' + escape(item.text) + '</div>';
                    },
                    item: function(item, escape) {
                        return '<div class="h6 inline-block">' + escape(item.text) + '</div>';
                    }
                }
            })
        }
    },
    mounted: function() {
        var self = this;
        this.$store.dispatch('setTitle', 'Analytics');
        return this.$store.dispatch('fetchAvailableTerms')
        .then(function(list) {
            self.availableTerms = list.filter(function(term) {
                return !!self.termDates[term.code] && self.termDates[term.code].start !== null;
            });
            self.termCode = self.route.params.termId || self.availableTerms[self.availableTerms.length - 1].code;
            return self.switchTerm();
        })
        .then(function() {
            self.initSelectize()
            // TODO: don't hard code this
            $('#quarters-selectized').prop('readonly', true)
            self.selectizeRef[0].selectize.setValue(self.termCode)
            self.$store.dispatch('hideSpinner')
        })
    },
    beforeDestroy: function() {
        // garbage collection
        this.selectizeRef[0].selectize.destroy()
        if (this.canvasId !== null) {
            Plotly.purge(document.getElementById(this.canvasId))
        }
        this.sectionsCanvasId.forEach(function(canvasId) {
            Plotly.purge(document.getElementById(canvasId))
        })
        this.sectionsCanvasId = []
        this.$store.commit('setTermName', null)
        this.$store.commit('emptyTerm', this.termCode)
    }

}
</script>

<style>
canvas {
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}
</style>
