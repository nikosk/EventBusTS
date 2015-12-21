describe('EventBus Tests ', function () {

	it('It should be created succesfully', function () {
		expect(new eventbus.EventBus()).toBeTruthy();
	});

	it('It should accept subscribers', function () {
		var eventBus = new eventbus.EventBus();
		var subscriberId = eventBus.subscribe("some/topic", function () {
		}, {async: true});
		expect(subscriberId).toBe(1);
	});

	it('It should fire events to subscribers on a topic', function () {
		var eventBus = new eventbus.EventBus();
		var test = 0;
		eventBus.subscribe("some/topic", function () {
			test = 1;
		});
		eventBus.publish("some/topic");
		expect(test).toBe(1);
	});

	it('It should pass data to subscribers', function () {
		var eventBus = new eventbus.EventBus();
		var test = {};
		eventBus.subscribe("some/topic", function (data) {
			test = data;
		});
		eventBus.publish("some/topic", {test: 10});
		expect(test.test).toBe(10);
	});

	it('It should fire persistent events when subscriber is registered after publish', function () {
		var eventBus = new eventbus.EventBus();
		var test = {};
		eventBus.publish("some/topic", {test: 10}, {persist: true});
		eventBus.subscribe("some/topic", function (data) {
			test = data;
		});
		expect(test.test).toBe(10);
	});

	describe('EventBus Async tests', function () {
		var test = {};
		var eventBus;

		beforeEach(function (done) {
			eventBus = new eventbus.EventBus();
			eventBus.subscribe("some/topic", function (data) {
				console.log("Published");
				test = data;
				done();
			}, {async: true});
			console.log("Subscribed");
			eventBus.publish("some/topic", {test: 10}, {async: true});
		});

		it('It should fire events asyncronously', function (done) {
			expect(test.test).toBe(10);
			console.log("Tested");
			done();
		});

	});

});
