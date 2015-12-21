/// <reference path="../../../typings/tsd.d.ts" />
var eventbus;
(function (eventbus) {
    var DefaultOptions = (function () {
        function DefaultOptions() {
            this.priority = 0;
            this.async = false;
            this.persist = false;
            this.cancellable = false;
        }
        return DefaultOptions;
    })();
    var EventBus = (function () {
        function EventBus() {
            var _this = this;
            this.subscriptions = {};
            this.wildcard_subscriptions = {};
            this.persistent_messages = {};
            this.id_lookup = {};
            this.new_id = 1;
            this.subscribe = function (topic, func, options, context) {
                var subscription_list;
                if (typeof topic === 'string') {
                    var topics = [topic];
                }
                else if (topic instanceof Array) {
                    var topics = topic;
                }
                var wildcard = false;
                var return_ids = [];
                options = _.defaults(options || {}, new DefaultOptions());
                for (var i = 0; i < topics.length; i++) {
                    var t = topics[i];
                    if (/\*$/.test(t)) {
                        wildcard = true;
                        t = t.replace(/\*$/, '');
                        subscription_list = _this.wildcard_subscriptions[t];
                        if (!subscription_list) {
                            _this.wildcard_subscriptions[t] = subscription_list = [];
                        }
                    }
                    else {
                        subscription_list = _this.subscriptions[t];
                        if (!subscription_list) {
                            _this.subscriptions[t] = subscription_list = [];
                        }
                    }
                    var id = _this.new_id++;
                    var subscription = {
                        'id': id,
                        'f': func,
                        priority: options.prority,
                        self: context,
                        'options': options
                    };
                    _this.id_lookup[id] = subscription;
                    subscription_list.push(subscription);
                    // Sort the list by priority
                    subscription_list = subscription_list.sort(function (a, b) {
                        return (a.priority > b.priority ? -1 : a.priority == b.priority ? 0 : 1);
                    });
                    // Put it back in after sorting
                    if (wildcard) {
                        _this.wildcard_subscriptions[t] = subscription_list;
                    }
                    else {
                        _this.subscriptions[t] = subscription_list;
                    }
                    return_ids.push(id);
                    // Check to see if there are any persistent topics that need
                    // to be fired immediately
                    if (!options.persist && _this.persistent_messages[t]) {
                        var persisted_subscription_list = _this.persistent_messages[t];
                        for (var j = 0; j < persisted_subscription_list.length; j++) {
                            subscription.f.call(subscription.self, persisted_subscription_list[j], { persist: true });
                        }
                    }
                }
                if (topics.length > 1) {
                    return return_ids;
                }
                return return_ids[0];
            };
            this.publish = function (topic, data, options) {
                var async_timeout = 10;
                var result;
                var overall_result = true;
                var cancelable = true;
                var internal_data = {};
                var subscriber;
                var wild_card_topic;
                var subscription_list = _this.subscriptions[topic] || [];
                options = _.defaults(options || {}, new DefaultOptions());
                // Look through wildcard subscriptions to find any that apply
                for (wild_card_topic in _this.wildcard_subscriptions) {
                    if (topic.indexOf(wild_card_topic) == 0) {
                        subscription_list = subscription_list.concat(_this.wildcard_subscriptions[wild_card_topic]);
                    }
                }
                if (options.persist === true) {
                    if (!_this.persistent_messages[topic]) {
                        _this.persistent_messages[topic] = [];
                    }
                    _this.persistent_messages[topic].push(data);
                }
                if (subscription_list.length == 0) {
                    return overall_result;
                }
                if (typeof options.cancelable == "boolean") {
                    cancelable = options.cancelable;
                }
                for (var i = 0; i < subscription_list.length; i++) {
                    subscriber = subscription_list[i];
                    if (subscriber.unsubscribed) {
                        continue; // Ignore unsubscribed listeners
                    }
                    try {
                        // Publisher OR subscriber may request async
                        if (options.async === true || (subscriber.options && subscriber.options.async)) {
                            setTimeout((function (inner_subscriber) {
                                return function () {
                                    inner_subscriber.f.call(inner_subscriber.self, data, topic, internal_data);
                                };
                            })(subscriber), async_timeout++);
                        }
                        else {
                            result = subscriber.f.call(subscriber.self, data, topic, internal_data);
                            if (cancelable && result === false) {
                                break;
                            }
                        }
                    }
                    catch (e) {
                        overall_result = false;
                    }
                }
                return overall_result;
            };
            this.unsubscribe = function (id) {
                if (_this.id_lookup[id]) {
                    _this.id_lookup[id].unsubscribed = true;
                    return true;
                }
                return false;
            };
            this.resubscribe = function (id) {
                if (_this.id_lookup[id]) {
                    _this.id_lookup[id].unsubscribed = false;
                    return true;
                }
                return false;
            };
        }
        return EventBus;
    })();
    eventbus.EventBus = EventBus;
})(eventbus || (eventbus = {}));
