"use strict";

const assert = require('assert');
const Wendigo = require('../../lib/wendigo');
const configUrls = require('../config.json').urls;

describe.only("Find By Text", function() {
    this.timeout(5000);
    let browser;

    before(async () => {
        browser = await Wendigo.createBrowser({log: true});
    });

    beforeEach(async () => {
        await browser.open(configUrls.index);

    });

    after(async () => {
        await browser.close();
    });

    it("Find By Text", async () => {
        // const headerElement = await browser.findByText("Main Title");
        const cssSelector = await browser.getSelector(".container");
        console.log(cssSelector);
    });

});
