/// <reference path="../../../typings/tsd.d.ts" />
namespace eventbus {

	interface Options {
		prority?:number;
		async?:boolean;
		persist?:boolean;
		cancelable?:boolean;
	}

	class DefaultOptions implements Options {
		public priority = 0;
		public async = false;
		public persist = false;
		public cancellable = false;
	}

	interface Subscriptions {
		[topic:string]:Array<Subscriber>;
	}

	interface Subscriber {
		unsubscribed:boolean;
		id: number;
		f:(topic:string, data?:any, context?:any, internal_data?:any)=>boolean,
		priority:number,
		self: any,
		options: Options
	}

	export class EventBus {

		private subscriptions:Subscriptions = {};
		private wildcard_subscriptions:Subscriptions = {};
		private persistent_messages:any = {};
		private id_lookup:any = {};
		private new_id:number = 1;

		public subscribe = (topic:string|string[], func:(topic:string, data?:any, context?:any, internal_data?:any)=>boolean, options?:Options, context?:any):Array<number>|number  => {

			var subscription_list:Array<Subscriber>;
			if (typeof topic === 'string') {
				var topics = [topic];
			} else if (topic instanceof Array) {
				var topics = topic;
			}

			var wildcard:boolean = false;
			var return_ids:Array<number> = [];

			options = _.defaults(options || {}, new DefaultOptions());


			for (var i = 0; i < topics.length; i++) {
				var t = topics[i];
				if (/\*$/.test(t)) {
					wildcard = true;
					t = t.replace(/\*$/, '');
					subscription_list = this.wildcard_subscriptions[t];
					if (!subscription_list) {
						this.wildcard_subscriptions[t] = subscription_list = [];
					}
				}
				else {
					subscription_list = this.subscriptions[t];
					if (!subscription_list) {
						this.subscriptions[t] = subscription_list = [];
					}
				}
				var id = this.new_id++;
				var subscription:Subscriber = <Subscriber>{
					'id': id,
					'f': func,
					priority: options.prority,
					self: context,
					'options': options
				};
				this.id_lookup[id] = subscription;
				subscription_list.push(subscription);
				// Sort the list by priority
				subscription_list = subscription_list.sort(function (a:Subscriber, b:Subscriber) {
					return (a.priority > b.priority ? -1 : a.priority == b.priority ? 0 : 1);
				});
				// Put it back in after sorting
				if (wildcard) {
					this.wildcard_subscriptions[t] = subscription_list;
				}
				else {
					this.subscriptions[t] = subscription_list;
				}
				return_ids.push(id);

				// Check to see if there are any persistent topics that need
				// to be fired immediately
				if (!options.persist && this.persistent_messages[t]) {
					var persisted_subscription_list = this.persistent_messages[t];
					for (var j = 0; j < persisted_subscription_list.length; j++) {
						subscription.f.call(subscription.self, persisted_subscription_list[j], {persist: true});
					}
				}
			}
			if (topics.length > 1) {
				return return_ids;
			}
			return return_ids[0];
		};

		public publish = (topic:string, data?:any, options?:Options) => {
			var async_timeout = 10;
			var result:any;
			var overall_result = true;
			var cancelable = true;
			var internal_data:any = {};
			var subscriber:Subscriber;
			var wild_card_topic:string;
			var subscription_list = this.subscriptions[topic] || [];
			options = _.defaults(options || {}, new DefaultOptions());

			// Look through wildcard subscriptions to find any that apply
			for (wild_card_topic in this.wildcard_subscriptions) {
				if (topic.indexOf(wild_card_topic) == 0) {
					subscription_list = subscription_list.concat(this.wildcard_subscriptions[wild_card_topic]);
				}
			}
			if (options.persist === true) {
				if (!this.persistent_messages[topic]) {
					this.persistent_messages[topic] = [];
				}
				this.persistent_messages[topic].push(data);
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
						setTimeout((function (inner_subscriber:Subscriber) {
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

		public unsubscribe = (id:number) => {
			if (this.id_lookup[id]) {
				this.id_lookup[id].unsubscribed = true;
				return true;
			}
			return false;
		};

		resubscribe = (id:number) => {
			if (this.id_lookup[id]) {
				this.id_lookup[id].unsubscribed = false;
				return true;
			}
			return false;
		}
	}

}
