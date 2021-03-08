/* globals DataTransfer, ClipboardEvent */
/* Linkedin plugin
 */

import {parseTemplate, insertText} from '../utils';
import {isQuill} from '../utils/editors-quill';
import {insertPlainText} from '../utils/plain-text';
import {parseFullName} from '../utils/parse-text';

// get all required data from the dom
function getData (params) {
    var vars = {
        from: {},
        to: [],
        subject: ''
    };

    let fromName = '';
    const $fromContainer = document.querySelector('.global-nav__me-photo');
    if ($fromContainer) {
        fromName = $fromContainer.getAttribute('alt');
    }
    var from = {
        name: fromName,
        first_name: '',
        last_name: '',
        email: ""
    };

    var parsedName = parseFullName(fromName);
    from.first_name = parsedName.first_name;
    from.last_name = parsedName.last_name;
    vars.from = from;

    // message thread in Messaging interface
    const messagingUiThread = '.msg-thread';
    // thread in message bubble/dialog
    const bubbleMessageThread = '.msg-overlay-conversation-bubble__content-wrapper';
    // post in feed
    const feedPost = '.feed-shared-update-v2';
    // select any
    const messageThreadSelector = `${messagingUiThread}, ${bubbleMessageThread}, ${feedPost}`;

    // contact name in message threads
    const messageContactName = '.msg-s-event-listitem--other .msg-s-message-group__name';
    // contact name in feed post
    const feedContactName = '.feed-shared-actor__name';
    // select any
    const contactNameSelector = `${messageContactName}, ${feedContactName}`;

    const $thread = params.element.closest(messageThreadSelector);
    // check if a message thread is visible,
    // otherwise we're in a non-messaging textfield.
    if ($thread) {
        // get the contacts from the thread, that is not ours
        const $contacts = $thread.querySelectorAll(contactNameSelector);
        if ($contacts.length) {
            // get the last contact
            const $contact = $contacts.item($contacts.length - 1);
            parsedName = parseFullName($contact.innerText);
            var to = {
                name: name,
                first_name: '',
                last_name: '',
                email: ''
            };

            to.first_name = parsedName.first_name;
            to.last_name = parsedName.last_name;
            vars.to.push(to);
        }
    }

    return vars;
}

// zero-width whitespace
const specialChar = '\u200b';

function focusSpecialCharacter(editorNode) {
    const lastSpecialCharNode = Array.from(editorNode.children).reverse().find((node) => {
        // trim textContent in case we add spaces after the template shortcut
        const text = (node.textContent || '').trim();
        const specialCharPosition = text.indexOf(specialChar);

        // find the node where the special char is at the end
        return (
            specialCharPosition !== -1 &&
            specialCharPosition === text.length - 1
        );
    });

    // node should always be available,
    // but in case we don't find it.
    if (lastSpecialCharNode) {
        // remove the special char from the node,
        // so we don't have issues later with finding the newest inserted one
        // (in case we insert multiple multi-line templates).
        lastSpecialCharNode.textContent = lastSpecialCharNode.textContent.replace(new RegExp(specialChar, 'g'), '');

        // place the focus at the node with the special character
        const range = document.createRange();
        range.selectNodeContents(lastSpecialCharNode);
        range.collapse();

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

var activeCache = null;
function isActive () {
    if (activeCache !== null) {
        return activeCache;
    }

    activeCache = false;
    var linkedinUrl = '.linkedin.com/';

    // trigger the extension based on url
    if (window.location.href.indexOf(linkedinUrl) !== -1) {
        activeCache = true;
    }

    return activeCache;
}

function isMessageEditor (element) {
    return (
        element &&
        element.getAttribute('contenteditable') === 'true' &&
        element.getAttribute('role') === 'textbox'
    );
}

export default (params = {}) => {
    if (!isActive()) {
        return false;
    }

    var data = getData(params);
    var parsedTemplate = parseTemplate(params.quicktext.body, data);

    const parsedParams = Object.assign({
        text: parsedTemplate
    }, params);

    // Quill is used for posts and comments
    if (isQuill(params.element)) {
        // LinkedIn uses a customized Quill editor for posts.
        // Inserting text with newlines causes each block/line to be split into
        // multiple paragraph tags.
        // This causes our range object to change after we insert the text,
        // and places the focus at the start of the editor.
        // Since the inserted dom is changed, we place a special character
        // at the end of the template, so we can later find it and place focus there
        // (at the end of the inserted template).

        // parsed template with special char
        const updatedTemplate = `${parsedTemplate}${specialChar}`;
        insertPlainText(
            Object.assign(
                {},
                parsedParams,
                {
                    text: updatedTemplate
                }
            )
        );

        // wait for the LinkedIn editor to restructure the inserted template nodes.
        const editorUpdate = new MutationObserver((mutationsList, observer) => {
            // find the previously-placed special character in the editor contents.
            focusSpecialCharacter(params.element);
            observer.disconnect();
        });
        editorUpdate.observe(params.element, {childList: true, subtree: true});

        return true;
    }

    // messaging, ember editor.
    // separate handling required for multi-line templates.
    if (isMessageEditor(params.element)) {
        insertPlainText(parsedParams);

        // send input event.
        // makes the ember editor aware of the inserted text,
        // but doesn't rebuild the dom nodes.
        // without it, the inserted template disappears when we press enter.
        // multi line templates are shown as a singles-line, until we press enter.
        params.element.dispatchEvent(new Event('input', {
            bubbles: true
        }));

        // sends an empty paste event so the editor restructures the dom
        // making it aware of the newlines.
        // otherwise, when we press Enter, multi line templates will be
        // compressed to one line.
        try {
            const clipboardData = new DataTransfer();
            clipboardData.setData('text/plain', specialChar);
            const customPasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                clipboardData: clipboardData
            });
            params.element.dispatchEvent(customPasteEvent);
        } catch (err) {
            // will throw an error on Safari
            // because it doesn't support the DataTransfer constructor
            // or passing custom clipboard data in the Event constructor,
            // required for clipboardData.
            // Adding a fake clipboardData property to an existing event
            // also doesn't work, because it strips the entire object
            // by the time it reaches the event handler.
            // Until it supports the DataTransfer constructor,
            // multi-line templates will be inserted as one liners,
            // in LinkedIn messaging on Safari.
        }

        return true;
    }

    // generic editor, including textareas
    insertText(parsedParams);
    return true;
};
