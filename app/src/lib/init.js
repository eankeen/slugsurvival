module.exports = function(_, router) {
    var element = document.getElementById('loading');
    element.parentNode.removeChild(element);

    _.dispatch('checkVersion')

    router.beforeEach(function(to, from, next) {
        _.dispatch('ensureDataLoaded').then(next);
    })
}