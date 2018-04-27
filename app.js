/**
 * Object constructor. Requires userId and accessToken params to be provided
 * either by position or by object key.
 *
 * @param userId
 * @param accessToken
 * @param domElement
 * @constructor
 */
var Basiq = function (userId, accessToken, domElement) {
    var self = this;

    if (typeof userId === "object") {
        accessToken = userId.accessToken;
        userId = userId.userId;
        domElement = userId.domElement;
    }

    if (!userId && !accessToken) {
        throw new Error("You need to pass the user id and access token to the control");
    }

    this.host = "http://basiq-blink.s3-website-eu-west-1.amazonaws.com/";
    this.userId = userId;
    this.accessToken = accessToken;
    this.url = this.host + "?iframe=true&user_id=" + this.userId + "&access_token=" + this.accessToken;
    this.domElement = null;
    this.initialized = false;
    this.rendered = false;

    this.listeners = {};


    if (!domElement) {
        try {
            domElement = document.getElementsByTagName("body")[0];
        } catch (e) {
            console.error("No body element found in your document", e);
        }
    } else if (typeof domElement === "string") {
        domElement = document.getElementById(domElement);
    }

    self.domElement = domElement;


    /**
     * Initialises postMessage listener
     *
     * @returns {Basiq}
     */
    var init = function () {
        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent",
            eventer = window[eventMethod],
            messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

        eventer(messageEvent, function (e) {
            var data = JSON.parse(e.data);

            for (var event in self.listeners) {
                if (!self.listeners.hasOwnProperty(event)) {
                    continue;
                }
                var cbs = self.listeners[event];

                if (event === data.event) {
                    cbs.forEach(function (cb) {
                        cb(data.payload, event);
                    })
                }
            }
        });

        self.initialized = true;

        return self;
    };

    init();

    /**
     * Attaches a listener to an event emitted by the frame
     *
     * @param events Array
     * @param cb Function
     * @returns {Basiq}
     */
    this.addListener = function (events, cb) {
        if (typeof cb !== "function") {
            throw new Error("Passed callback must be a function");
        }

        if (!(events instanceof Array)) {
            events = [events];
        }

        events.forEach(function (event) {
            self.registerHandler(event, cb);
        });

        return self;
    };

    this.registerHandler = function (event, cb) {
        if (!self.listeners[event]) {
            self.listeners[event] = [];
        }

        self.listeners[event].push(cb);
    };

    /**
     * Shows the control
     *
     * @returns {Basiq}
     */
    this.show = function () {
        if (!self.rendered) {
            throw new Error("Component has not been rendered");
        }

        self.backdrop.style.visibility = "visible";

        return self;
    };

    /**
     * Hides the control
     *
     * @returns {Basiq}
     */
    this.hide = function () {
        if (!self.rendered) {
            throw new Error("Component has not been rendered");
        }

        self.backdrop.style.visibility = "hidden";

        return self;
    };

    /**
     * Destroys the control
     * @returns {Basiq}
     */
    this.destroy = function () {
        if (!self.rendered || !self.initialized) {
            throw new Error("Component has not been rendered");
        }

        self.domElement.removeChild(self.backdrop);
        self.backdrop = null;
        self.container = null;
        self.initialized = false;
        self.rendered = false;
        self.listeners = {};

        return self;
    };

    /**
     * Renders the control by attaching the backdrop div to the
     * given dom element
     *
     * @returns {Basiq}
     */
    this.render = function () {
        if (self.rendered === true) {
            self.show();

            return self;
        }

        var backdrop = document.createElement("div"),
            container = document.createElement("div"),
            iframe = document.createElement("iframe");

        self.backdrop = backdrop;
        self.container = container;
        self.backdrop.style = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 100; background: rgba(0, 0, 0, 0.4);";
        self.container.style = "position: fixed; top: 50%; left: 50%; margin-left: -153px; margin-top: -225px; width: 307px; height: 450px; border-radius: 15px; z-index: 101; -webkit-box-shadow: 0 2px 4px 0 rgba(0,0,0,0.50); -moz-box-shadow: 0 2px 4px 0 rgba(0,0,0,0.50); box-shadow: 0 2px 4px 0 rgba(0,0,0,0.50);";


        iframe.src = self.url;
        iframe.id = "basiq-modal-frame";
        iframe.frameBorder = "0";
        iframe.style = "width: 100%; height: 100%; border-radius: 15px;";

        backdrop.id = "basiq-modal-container-backdrop";
        container.id = "basiq-modal-container";
        container.appendChild(iframe);
        backdrop.appendChild(container);
        self.domElement.appendChild(backdrop);

        self.rendered = true;
        self.initialized = true;

        self.addListener(["cancellation", "completion"], function () {
            self.destroy();
        });

        return self;
    };
};

window.Basiq = Basiq;