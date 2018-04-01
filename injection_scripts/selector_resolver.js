let xpathNamespaceResolver = {
    svg: 'http://www.w3.org/2000/svg',
    mathml: 'http://www.w3.org/1998/Math/MathML'
};

getElementByXPath = function getElementByXPath(expression) {
    let a = document.evaluate(expression, document.body, xpathNamespaceResolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    if (a.snapshotLength > 0) {
        return a.snapshotItem(0);
    }
};

// ACCEPTS text (textContent) or element
// TODO: fix crappy code
window.getStuff = function(arg) {
    retrieveCssOrXpathSelectorFromTextOrNode = function(arg, type) {
        let root = [], node;
        nodeType = type.toLowerCase();
        function retrieveNodeNameAndAttributes(node) {
            let output = '';
            try {
                var nodeName = node.nodeName.toLowerCase();
            } catch(e) {
                console.error('ERROR no matching node');
                return;
            }
            if (node.hasAttributes()) {
                let attrs = node.attributes;
                for (let i = 0; i < attrs.length; i++) {
                    if (nodeType === 'xpath') {
                        if (attrs[i].value) {
                            output += `[@${ attrs[i].name }='${ attrs[i].value }']`;
                        } else {
                            output += `[@${ attrs[i].name }]`;
                        }
                    } else if (nodeType === 'css') {
                        if (attrs[i].value) {
                            if (attrs[i].name === 'id') {
                                if (/:/.test(attrs[i].value)) {
                                    output += `[id='${ attrs[i].value }']`; // new Ex: [id="foo:bar"]
                                } else {
                                    output += `#${ attrs[i].value}`;
                                }
                            } else if (attrs[i].name === 'class') {
                                let classes = attrs[i].value.split(/\s+\b/).join('.');
                                output += `.${ classes}`;
                            } else {
                                output += `[${ attrs[i].name }='${ attrs[i].value }']`;
                            }
                        } else {
                            output += `[${ attrs[i].name }]`;
                        }
                    }
                }
            }

            let txt = '';
            if (nodeName === 'a' && nodeType === 'xpath') {
                txt = `[text()='${ node.innerText }']`;
            }

            root.push({'name': nodeName, 'attrs': output, txt});

            if (nodeName === 'body') return;
            else retrieveNodeNameAndAttributes(node.parentNode); // recursive function
        }

        if (typeof arg === 'string') { // text from within the page
            let selector = `//*[text()[contains(.,"${ arg }")]]`;
            node = getElementByXPath(selector);
        } else if (typeof arg === 'object') { // node argument, let's do some 'duck typing'
            if (arg && arg.nodeType) {
                node = arg;
            } else {
                console.error("ERROR expected node, get object");
                return;
            }
        } else {
            console.error("ERROR expected node or string argumument");
            return;
        }

        retrieveNodeNameAndAttributes(node);

        let output = '';
        if (nodeType === 'css') {
            output = root.reverse().map(elt => elt.name + elt.attrs ).join(' > ');
        } else if (nodeType === 'xpath') {
            output = `//${ root.reverse().map(elt => elt.name + elt.txt + elt.attrs ).join('/')}`;
        } else {
            console.error(`ERROR unknown type ${ type}`);
        }

        return output;
    // console.log(output);

    };
    console.log(`CSS\n${ retrieveCssOrXpathSelectorFromTextOrNode(arg, 'css')}`);
    console.log(`XPath\n${ retrieveCssOrXpathSelectorFromTextOrNode(arg, 'xpath')}`);
};
