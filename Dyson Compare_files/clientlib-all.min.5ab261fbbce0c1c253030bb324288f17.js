/*! contact-data-services.js | https://github.com/experiandataquality/RealTimeAddress | Apache-2.0
*   Experian Data Quality | https://github.com/experiandataquality */

;(function (window, document, undefined) {

  "use strict";

// Create ContactDataServices constructor and namespace on the window object (if not already present)
  var ContactDataServices = window.ContactDataServices = window.ContactDataServices || {};

// Default settings
  ContactDataServices.defaults = {
    input: {placeholderText: "Start typing an address"},
    formattedAddress: {headingType: "h3", headingText: "Validated address"},
    editAddressText: "Edit address",
    searchAgainText: "Search again",
    useAddressEnteredText: "enter address manually",
    useSpinner: false,
    language: "en",
    addressLineLabels: [
      "addressLine1",
      "addressLine2",
      "addressLine3",
      "locality",
      "province",
      "postalCode",
      "country"
    ]
  };

// Constructor method event listener (pub/sub type thing)
  ContactDataServices.eventFactory = function () {
    // Create the events object
    var events = {};

    // Create an object to hold the collection of events
    events.collection = {};

    // Subscribe a new event
    events.on = function (event, action) {
      // Create the property array on the collection object
      events.collection[event] = events.collection[event] || [];
      // Push a new action for this event onto the array
      events.collection[event].push(action);
    };

    // Publish (trigger) an event
    events.trigger = function (event, data) {
      // If this event is in our collection (i.e. anyone's subscribed)
      if (events.collection[event]) {
        // Loop over all the actions for this event
        for (var i = 0; i < events.collection[event].length; i++) {
          // Create array with default data as 1st item
          var args = [data];

          // Loop over additional args and add to array
          for (var a = 2; a < arguments.length; a++) {
            args.push(arguments[a]);
          }

          // Call each action for this event type, passing the args
          events.collection[event][i].apply(events.collection, args);
        }
      }
    };

    // Return the new events object to be used by whoever invokes this factory
    return events;
  };

// Translations
  ContactDataServices.translations = {
// language / country / property
    en: {
      gbr: {
        locality: "Town/City",
        province: "County",
        postalCode: "Post code"
      },
      usa: {
        locality: "City",
        province: "State",
        postalCode: "Zip code"
      },
      fra: {
        locality: "Town/City",
        province: "County",
        postalCode: "Post code"
      },
      deu: {
        locality: "Town/City",
        province: "County",
        postalCode: "Post code"
      },
      ita: {
        locality: "Town/City",
        province: "County",
        postalCode: "Post code"
      },
      aut: {
        locality: "Town/City",
        province: "County",
        postalCode: "Post code"
      }
    }
    // Add other languages below
  };

// Method to handle showing of UA (User Assistance) content
  ContactDataServices.ua = {
    banner: {
      show: function (html) {
        // Retrieve the existing banner
        var banner = document.querySelector(".ua-banner");

        // Create a new banner if necessary
        if (!banner) {
          var firstChildElement = document.querySelector("body").firstChild;
          banner = document.createElement("div");
          banner.classList.add("ua-banner");
          firstChildElement.parentNode.insertBefore(banner, firstChildElement.nextSibling);
        }

        // Apply the HTML content
        banner.innerHTML = html;
      },
      hide: function () {
        var banner = document.querySelector(".ua-banner");
        if (banner) {
          banner.parentNode.removeChild(banner);
        }
      }
    }
  };

// Generate the URLs for the various requests
  ContactDataServices.urls = {
    endpoint: {
	  // RADO-142 Changes
	  url: function() {
		 let baseUrl = null;
         let element = document.querySelector(".js-address-lookup-input");
           baseUrl = element.getAttribute("data-qassearch-url");
    return baseUrl;
	  },
     //To construct api gateway format url 
Formaturl: function() {
  let baseUrl = null;
         let element = document.querySelector(".js-address-lookup-input");
           baseUrl = element.getAttribute("data-qasformat-url");
    return baseUrl;
 }
    },
    construct: {
      address: {
        // Construct the Search URL by appending query, country & take
        search: function (instance) {
          var url = ContactDataServices.urls.endpoint.url();
          if (instance.currentCountryCode === 'nld' && instance.currentSearchTerm.length > 4) {
            instance.currentSearchTerm = instance.currentSearchTerm.substring(0,4) + ' ' + instance.currentSearchTerm.substring(4,instance.currentSearchTerm.length);
          }
          url += "?query=" + instance.currentSearchTerm;
          url += "&country=" + instance.currentCountryCode;
          url += "&take=" + (instance.maxSize || instance.picklist.maxSize);
          if(instance.dataSet){
            url += "&dataset=" + instance.dataSet
          }
          return url;
        },
        // Append the country code and id of the address selected by user to the api gateway format URL
        format: function (url) {
          var FormatUrl = ContactDataServices.urls.endpoint.Formaturl();
          var parameter=url.split("?");
        //append country code & id to apigateway endpoint url
          FormatUrl += "?" + parameter[1];
           return FormatUrl;
        }
      }
    },
    getParameter: function (name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
      return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
  };

// Integrate with address searching
  ContactDataServices.Address = function (options) {

    // Build our new instance from user custom options
    var instance = options || {};

    // Initialising some defaults
    instance.enabled = true;
    instance.language = instance.language || ContactDataServices.defaults.language;
    instance.useSpinner = instance.useSpinner || ContactDataServices.defaults.useSpinner;
    instance.lastSearchTerm = "";
    instance.currentSearchTerm = "";
    instance.lastCountryCode = "";
    instance.currentCountryCode = "";
    instance.currentSearchUrl = "";
    instance.currentFormatUrl = "";
    instance.placeholderText = instance.placeholderText || ContactDataServices.defaults.input.placeholderText;
    instance.editAddressText = instance.editAddressText || ContactDataServices.defaults.editAddressText;
    instance.searchAgainText = instance.searchAgainText || ContactDataServices.defaults.searchAgainText;
    instance.formattedAddress = instance.formattedAddress || ContactDataServices.defaults.formattedAddress;
    instance.elements = instance.elements || {};

    // Create a new object to hold the events from the event factory
    instance.events = new ContactDataServices.eventFactory();

    // Initialise this instance
    instance.init = function () {
      instance.setCountryList();

      if (instance.elements.input) {
        instance.input = instance.elements.input;
        // Bind an event listener on the input
        instance.input.addEventListener("keyup", instance.search);
        instance.input.addEventListener("keydown", instance.initEnter);
        // Set a placeholder for the input
        instance.input.setAttribute("placeholder", instance.placeholderText);
        // Disable autocomplete on the form
        instance.input.parentNode.setAttribute("autocomplete", "off");
        // Disable form submission for demo purposes
        instance.input.parentNode.addEventListener('submit', function (event) {
          event.preventDefault();
        });
        // Display manual address input initially
        instance.useAddressEnteredCopy.init();
        // Attaching the init method to display fields with clicked
        if (instance.input.dataset.addressErrorManualEntryMessage === 'true') {
          const addressLookupWrapper = instance.getWrapper();
          addressLookupWrapper.addEventListener('click', function (event) {
            instance.picklist.useAddressEntered.validateElement(event) && instance.picklist.useAddressEntered.click();
          });
          addressLookupWrapper.addEventListener('keydown', function (event) {
            instance.picklist.useAddressEntered.validateElement(event) && instance.picklist.useAddressEntered.keydown(event);
          });
        }
      }

      if (instance.elements && instance.elements.addressLookupResultsElement) {
        instance.addressLookupResultsElement = instance.elements.addressLookupResultsElement;
      }
    };

    // Main function to search for an address from an input string
    instance.search = function (event) {
      // Handle keyboard navigation
      var e = event || window.event;
      e = e.which || e.keyCode;
      if (e === 38/*Up*/ || e === 40/*Down*/) {
        instance.picklist.keydown(e, event);
        return;
      }

      instance.currentSearchTerm = instance.input.value;
      instance.currentCountryCode = instance.countryList.value;

      // Check is searching is permitted
      if (instance.canSearch()) {
        // Abort any outstanding requests
        if (instance.request.currentRequest) {
          instance.request.currentRequest.abort();
        }

        // Fire an event before a search takes place
        instance.events.trigger("pre-search", instance.currentSearchTerm);

        // Construct the new Search URL
        var url = ContactDataServices.urls.construct.address.search(instance);

        // Store the last search term
        instance.lastSearchTerm = instance.currentSearchTerm;

        // Hide any previous results
        instance.result.hide();

        // Hide the inline search spinner
        instance.searchSpinner.hide();

        // Show an inline spinner whilst searching
        instance.searchSpinner.show();

        // Initiate new Search request
        instance.request.get(url, instance.picklist.show);
      } else if (instance.lastSearchTerm !== instance.currentSearchTerm) {
          if (instance.input.dataset.addressErrorManualEntryMessage === 'true' && instance.input.getAttribute('aria-invalid') === 'true') {
            instance.useAddressEnteredCopy.hide();
          } else {
          // Clear the picklist if the search term is cleared/empty
          instance.picklist.hide();
          instance.input.removeAttribute('aria-activedescendant');
          // Display manual address input if the search term is cleared/empty
          instance.useAddressEnteredCopy.show();
        }
      }
    };

    instance.initEnter = function (event) {
      // Handle keyboard navigation
      var e = event || window.event;
      e = e.which || e.keyCode;
      if (e === 13/*Enter*/) {
        instance.picklist.keydown(e, event);
        return;
      }
    };

    instance.setCountryList = function () {
      instance.countryList = instance.elements.countryList;

      // If the user hasn't passed us a country list, then create new list?
      if (!instance.countryList) {
        instance.createCountryDropdown();
      }
    };

    // Determine whether searching is currently permitted
    instance.canSearch = function () {
      // If searching on this instance is enabled, and
      return (instance.enabled &&
        // If search term is not empty, and
        instance.currentSearchTerm !== "" &&
        // If search term is not the same as previous search term, and
        instance.lastSearchTerm !== instance.currentSearchTerm &&
        // If the country is not empty
        instance.countryList.value !== undefined && instance.countryList.value !== "");
    };

    instance.createCountryDropdown = function () {
      // What countries?
      // Where to position it?
      instance.countryList = {};
    };

    // Get a final (Formatted) address
    instance.format = function (url) {
      // Trigger an event
      instance.events.trigger("pre-formatting-search", url);
      // Hide the searching spinner
      instance.searchSpinner.hide();
      // store format endpoint of selected address
      instance.currentFormatUrl = url;
      //get constructed  apigateway format end point
      var ApigatewayFormatUrl=ContactDataServices.urls.construct.address.format(url);
      // Initiate a new Format request
      instance.request.get(ApigatewayFormatUrl, instance.result.show);
    };

    instance.picklist = {
      // Set initial size
      size: 0,
      // Set initial max size
      maxSize: 25,
      // Render a picklist of search results
      show: function (items) {
        // Store the picklist items
        instance.picklist.items = items.results;

        // Reset any previously selected current item
        instance.picklist.currentItem = null;

        // Update picklist size
        instance.picklist.size = instance.picklist.items.length;

        // Get/Create picklist container element
        instance.picklist.container = instance.picklist.container || instance.picklist.createList();

        // Ensure previous results are cleared
        instance.picklist.container.innerHTML = "";

        if (document.querySelector('main.checkout-v2-flow') && instance.picklist.size > 0) {
          // Create and prepend the header with "Suggestions" and close icon
          var headerItem = instance.picklist.createHeader();
          instance.picklist.container.appendChild(headerItem);

          // Create the body container (this will be the scrollable part)
          var bodyContainer = document.createElement("div");
          bodyContainer.classList.add("address-picklist-body");
          instance.picklist.container.appendChild(bodyContainer);
        }

        // Reset the picklist tab count (used for keyboard navigation)
        instance.picklist.resetTabCount();

        // Hide the inline search spinner
        instance.searchSpinner.hide();

        // Destroy user address when addressErrorManualEntryMessage is true to create a new useAddressEntered
        if (instance.input.dataset.addressErrorManualEntryMessage === 'true') {
          instance.picklist.useAddressEntered.destroy();
        }
        // Prepend an option for "use address entered"
        instance.picklist.useAddressEntered.element = instance.picklist.useAddressEntered.element || instance.picklist.useAddressEntered.create();

        // Fire an event before picklist is created
        instance.events.trigger("pre-picklist-create", instance.picklist.items);

        if (instance.picklist.size > 0) {
          var picklistItems = instance.picklist.items;
          try {
            let regionList = instance.elements.input.getAttribute('data-region');
            if (regionList && regionList !== 'false') {
              regionList = regionList.split(',');
              picklistItems = picklistItems.filter(function (data) {
                const match = regionList.some(function (el) {
                  return data.suggestion.includes(' ' + el + ' ');
                });
                return !match;
              });
            }
          } catch (e) {
            picklistItems = instance.picklist.items;
          }
          // Iterate over and show results
          picklistItems.forEach(function (item, index) {
            // Create a new item/row in the picklist
            var listItem = instance.picklist.createListItem(item, index);
            if(document.querySelector('main.checkout-v2-flow')) {
              bodyContainer.appendChild(listItem);
            } else {
              instance.picklist.container.appendChild(listItem);
            }

            // Listen for selection on this item
            instance.picklist.listen(listItem);
          });
          // Fire an event after picklist is created
          instance.events.trigger("post-picklist-create");
        }

        // Set lookup input aria-expanded to true when list is populated with items - acccesibility
        instance.input.setAttribute("aria-expanded", instance.picklist.size > 0);

        // Set accessbility address count text
        if(instance.addressLookupResultsElement ) {
          const addressLookupResultsText = instance.addressLookupResultsElement.getAttribute('data-address-lookup-results');
          instance.addressLookupResultsElement.innerHTML = instance.picklist.size + addressLookupResultsText;
        }
        //Event listener to close the address lookup when clicked outside
        if (document.querySelector('main.checkout-v2-flow') && instance.picklist.size > 0) {
          document.addEventListener("click", instance.picklist.handleOutsideClick);
        }
      },
      //Close the address lookup when clicked outside
      handleOutsideClick: function (e) {
        const picklist = instance.picklist.container;
        const input = instance.input;
        const manualEntry = instance.picklist.useAddressEntered.element;
      
        if (picklist && !picklist.contains(e.target) && !input.contains(e.target) &&(!manualEntry || !manualEntry.contains(e.target))) {
        instance.picklist.hide();
      
        // Remove the event listener
        document.removeEventListener("click", instance.picklist.handleOutsideClick);
        }
      },
      // Create the header list item with "Suggestions" and close icon (SVG)
      createHeader: function () {
        var header = document.createElement("div");
        header.classList.add("address-picklist-header");

        var searchSuggestionsText = instance?.addressLookupResultsElement ? instance.addressLookupResultsElement.getAttribute('data-i18n-suggestions') : instance.elements.input.getAttribute('data-i18n-suggestions');
        var headerText = document.createElement("span");
        headerText.classList.add("address-picklist-header-text");
        headerText.innerText = searchSuggestionsText;

        var closeButton = document.createElement("span");
        closeButton.classList.add("address-picklist-close-btn");

        // Create the SVG element
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svg.setAttribute("width", "16");
        svg.setAttribute("height", "16");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("fill", "none");

        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M14.5 2.64969L13.3544 1.5L8 6.85031L2.64969 1.5L1.5 2.64969L6.85438 8L1.5 13.3503L2.64969 14.5L8 9.14969L13.3544 14.5L14.5 13.3503L9.14969 8L14.5 2.64969Z");
        path.setAttribute("fill", "#595959");

        // Append the path to the SVG
        svg.appendChild(path);

        // Append the SVG to the close button
        closeButton.appendChild(svg);

        // Close button event listener
        closeButton.addEventListener("click", function () {
          // Trigger the "Enter address manually" behavior when close is clicked
          instance.picklist.useAddressEntered.click();
        });

        header.appendChild(headerText);
        header.appendChild(closeButton);

        return header;
      },
      // Remove the picklist
      hide: function () {
        // Clear the current picklist item
        instance.picklist.currentItem = null;
        // Remove the "use address entered" option too
        instance.picklist.useAddressEntered.destroy();
        // Remove the main picklist container
        if (instance.picklist.container) {
          instance.input.parentNode.removeChild(instance.picklist.container);
          instance.picklist.container = undefined;
          // Set aria-expanded for lookup input when list not available anymore - accesibility
          instance.input.setAttribute("aria-expanded", false);
        }
      },
      useAddressEntered: {
        // Create a "use address entered" option
        create: function () {
          const addressErrorManualEntryMessage = instance.input.dataset.addressErrorManualEntryMessage,
          item = {
            suggestion: this.getText(),
            format: ""
          };
          // Hide the initial manual address input option when original is shown
          instance.useAddressEnteredCopy.hide();
          if (addressErrorManualEntryMessage === 'true' && instance.picklist.items.length === 0) {
            item.suggestion = "";
          }
          var listItem = instance.picklist.createSpanItem(item);
          listItem.classList.add("use-address-entered");
          listItem.setAttribute('tabindex', 0);
          listItem.setAttribute("data-automation-enter-manually-link", "enter manual address link");
          instance.picklist.container.parentNode.insertBefore(listItem, instance.picklist.container.nextSibling);
          listItem.addEventListener("click", instance.picklist.useAddressEntered.click);
          listItem.addEventListener("keydown", instance.picklist.useAddressEntered.keydown);
          return listItem;
        },
        // Destroy the "use address entered" option
        destroy: function () {
          if (instance.picklist.useAddressEntered.element) {
            instance.picklist.container.parentNode.removeChild(instance.picklist.useAddressEntered.element);
            instance.picklist.useAddressEntered.element = undefined;
            if (instance.picklist.container.nextElementSibling) {
              instance.picklist.container.parentNode.removeChild(instance.picklist.container.nextElementSibling);
            }
          }
        },
        // Use the address entered as the Formatted address
        click: function () {
          var inputData = {
            address: []
          };

          if (instance.input.value === ""){
            instance.currentSearchTerm = "";
          }

          // Try and split into lines by using comma delimiter
          var lines = instance.currentSearchTerm.split(",");

          // Map each address line label to a line, or empty array if there is no line
          inputData.address = ContactDataServices.defaults.addressLineLabels.map( function (label, index) {
            var obj = {};
            if (lines[index]) {
              obj[label] = lines[index];
            } else {
              obj[label] = [];
            }
            return obj;
          });

          // set a flag for the withAddressLookup mixin to not validate the inputs if the click comes from 'enter address manually'
          inputData.isEditAddressManually = true;

          instance.result.show(inputData);
          instance.result.editAddressManually();
        },
        keydown: function (e) {
          if (e.keyCode === 13) {
            e.preventDefault();
            instance.picklist.useAddressEntered.click();
          }
        },
        // Create and return an address line object with the key as the label
        formatManualAddressLine: function (line, i) {
          var key = ContactDataServices.defaults.addressLineLabels[i];
          var lineObject = {};
          lineObject[key] = line || "";
          return lineObject;
        },
        getText: function () {
          var text = instance.input.parentNode.getAttribute("data-use-address-entered-text");
          return text ? text : ContactDataServices.defaults.useAddressEnteredText;
        },
        validateElement: function (event) {
          var addressLookupGrandParent = instance.getWrapper();
          return event.target === addressLookupGrandParent.querySelector(".js-address-edit-manually.use-address-entered-text");
        },
      },
      // Create the picklist container and inject after the input
      createList: function () {
        var list = document.createElement("div");
        if(document.querySelector('main.checkout-v2-flow')) {
          list.classList.add("address-picklist-v2");
        } else {
          list.classList.add("address-picklist");
        }
        list.classList.add("js-address-picklist");
        list.classList.add("sessioncamhidetext");
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-labelledby", "post-code-lookup");
        list.id = "post-code-lookup-items";
        // Insert the picklist after the input
        if (instance.addressLookupResultsElement) {
          instance.addressLookupResultsElement.parentNode.insertBefore(list, instance.addressLookupResultsElement.nextSibling);
        } else {
          instance.input.parentNode.insertBefore(list, instance.input.nextSibling);
        }

        list.addEventListener("keydown", instance.picklist.enter);
        return list;
      },
      // Create a new picklist item/row
      createListItem: function (item, index) {
        var row = document.createElement("div");
        row.innerHTML = instance.picklist.addMatchingEmphasis(item);
        row.classList.add("address-list-item");
        // Store the Format URL
        row.setAttribute("format", item.format);
        row.setAttribute("role", "option");
        row.setAttribute("id", "address-list-item-" + index);
        row.setAttribute("data-automation-search-list", "list item");
        return row;
      },
      // Create a new picklist line
      createSpanItem: function (item) {
        var row = document.createElement("span");
        row.innerHTML = item.suggestion;
        return row;
      },
      // Tab count used for keyboard navigation
      tabCount: -1,
      resetTabCount: function () {
        instance.picklist.tabCount = -1;
      },
      // Keyboard navigation
      keydown: function (e, evt) {
        if (!instance.picklist.container) {
          return;
        }
        if (e === 13/*Enter*/ && evt.type === 'keydown') {
          instance.picklist.checkEnter(evt);
          return;
        }
        // Get a list of all the addresses in the picklist
        var addresses = instance.picklist.container.querySelectorAll("div"),
          firstAddress, lastAddress;

        // Set the tabCount based on previous and direction
        if (e === 38/*Up*/) {
          instance.picklist.tabCount--;
        }
        else {
          instance.picklist.tabCount++;
        }

        // Set top and bottom positions and enable wrap-around
        if (instance.picklist.tabCount < 0) {
          instance.picklist.tabCount = addresses.length - 1;
          lastAddress = true;
        }
        if (instance.picklist.tabCount > addresses.length - 1) {
          instance.picklist.tabCount = 0;
          firstAddress = true;
        }

        // Highlight the selected address
        var currentlyHighlighted = addresses[instance.picklist.tabCount];
        // Remove any previously highlighted ones
        var previouslyHighlighted = instance.picklist.container.querySelector(".selected");
        if (previouslyHighlighted) {
          previouslyHighlighted.classList.remove("selected");
        }
        if(currentlyHighlighted) {
          currentlyHighlighted.classList.add("selected");
        }
        // Set the currentItem on the picklist to the currently highlighted address
        instance.picklist.currentItem = currentlyHighlighted;

        // Scroll address into view, if required
        var addressListCoords = {
          top: instance.picklist.container.offsetTop,
          bottom: instance.picklist.container.offsetTop + instance.picklist.container.offsetHeight,
          scrollTop: instance.picklist.container.scrollTop,
          selectedTop: currentlyHighlighted ? currentlyHighlighted.offsetTop : 0,
          selectedBottom: currentlyHighlighted ? (currentlyHighlighted.offsetTop + currentlyHighlighted.offsetHeight) : 0,
          scrollAmount: currentlyHighlighted ? currentlyHighlighted.offsetHeight : 0
        };
        if (firstAddress) {
          instance.picklist.container.scrollTop = 0;
        }
        else if (lastAddress) {
          instance.picklist.container.scrollTop = 999;
        }
        else if (addressListCoords.selectedTop - addressListCoords.scrollAmount - addressListCoords.top < addressListCoords.scrollTop) {
          instance.picklist.container.scrollTop = addressListCoords.scrollTop - addressListCoords.scrollAmount;
        }
        else if (addressListCoords.selectedBottom + addressListCoords.scrollAmount > addressListCoords.bottom) {
          instance.picklist.container.scrollTop = addressListCoords.scrollTop + addressListCoords.scrollAmount;
        }
      },
      // Add emphasis to the picklist items highlighting the match
      addMatchingEmphasis: function (item) {
        var highlights = item.matched || [],
          label = item.suggestion;

        for (var i = 0; i < highlights.length; i++) {
          var replacement = '<b>' + label.substring(highlights[i][0], highlights[i][1]) + '</b>';
          label = label.substring(0, highlights[i][0]) + replacement + label.substring(highlights[i][1]);
        }
        var secondLastSpace = label.substring(0, label.lastIndexOf(' ')).lastIndexOf(' ');
        label = label.substring(0, secondLastSpace) + '<span style="white-space: nowrap">' + label.substring(secondLastSpace) + '</span>';
        return label;
      },
      // Listen to a picklist selection
      listen: function (row) {
        row.addEventListener("click", instance.picklist.pick.bind(null, row));
        row.addEventListener("keyup", instance.picklist.pickOnEnter.bind(null, row));
      },
      checkEnter: function (e) {
        var picklistItem;
        // If picklist contains 1 address then use this one to format
        if (instance.picklist.size === 1) {
          picklistItem = instance.picklist.container.querySelectorAll("div")[0];
        } // Else use the currently highlighted one when navigation using keyboard
        else if (instance.picklist.currentItem) {
          picklistItem = instance.picklist.currentItem;
        }
        if (picklistItem) {
          e.preventDefault();
          e.stopImmediatePropagation();
          instance.picklist.pick(picklistItem);
        }
      },
      pickOnEnter: function (item, e) {
        if (e.which == 13) {
          instance.picklist.pick(item);
        }
      },
      // How to handle a picklist selection
      pick: function (item) {
        // Fire an event when an address is picked
        instance.events.trigger("post-picklist-selection", item);

        // Get a final address using picklist item
        instance.format(item.getAttribute("format"));
      }
    };

    instance.getWrapper = function() {
      return instance.input.parentNode.parentNode;
    }

    // Controls "Enter address manually" link (only displayed when picklist is hidden)
    instance.useAddressEnteredCopy = {
      init: function () {
        var addressLookupGrandParent = instance.getWrapper();
        var item = addressLookupGrandParent.querySelector(".use-address-entered-text");
        item.addEventListener("click", instance.picklist.useAddressEntered.click);
        item.addEventListener("keydown", instance.picklist.useAddressEntered.keydown);
      },
      show: function () {
        var item;
        // If current page is checkout billing address and link does NOT exist
        if (instance.input.classList.contains('billing-address-lookup-input')) {
          const addressLookupGrandParent = instance.getWrapper();
          item = addressLookupGrandParent.querySelector(".use-address-entered-text.hidden-xs-up");
          if(item) {
            item.classList.remove("hidden-xs-up");
          }
        }
        // If current page is checkout delivery address and link does NOT exist
        else if (document.querySelector(".js-delivery-address-form-fields")) {
          item = document.querySelector(".js-delivery-address-form-fields .use-address-entered-container.hidden-xs-up");
          if (item) {
            item.classList.remove("hidden-xs-up");
          }
        }
        // Any other page and link does NOT exist
        else {
          item = document.querySelector(".use-address-entered-container.hidden-xs-up");
          if (item) {
            item.classList.remove("hidden-xs-up");
          }
        }
      },
      hide: function () {
        var item;
        // If current page is checkout billing address and link exists
        if (instance.input.classList.contains("billing-address-lookup-input")){
          const addressLookupGrandParent = instance.getWrapper();
          item = addressLookupGrandParent.querySelector(".use-address-entered-text");
          if (item) {
            item.classList.add("hidden-xs-up");
          }
        }
        // If current page is checkout delivery address and link exists
        else if (document.querySelector(".js-delivery-address-form-fields")) {
          item = document.querySelector(".js-delivery-address-form-fields .use-address-entered-container");
          if (item) {
            item.classList.add("hidden-xs-up");
          }
        }
        // Any other page and link exists
        else {
          item = document.querySelector(".use-address-entered-container");
          if (item) {
            item.classList.add("hidden-xs-up");
          }
        }
      }
    };

    instance.result = {
      // Render a Formatted address
      show: function (data) {
        // Hide the inline search spinner
        instance.searchSpinner.hide();

        // Hide the picklist
        instance.picklist.hide();

        // Clear search input
        instance.input.value = "";

        if (data.address.length > 0) {
          // Fire an event to say we've got the formatted address
          instance.events.trigger("post-formatting-search", data);
        }

        // Actually hidden until user selects "or use postcode lookup"
        instance.useAddressEnteredCopy.show();
      },
      hide: function () {
        if (instance.result.formattedAddress) {
          instance.input.parentNode.removeChild(instance.result.formattedAddress);
          instance.result.formattedAddress = undefined;
        }
      },
      // Create the formatted address container and inject after the input
      createFormattedAddressContainer: function () {
        var container = document.createElement("div");
        container.classList.add("formatted-address");
        // Create a heading for the formatted address
        if (instance.formattedAddress.heading !== false) {
          var heading = document.createElement(instance.formattedAddress.headingType);
          heading.innerHTML = instance.formattedAddress.headingText;
          container.appendChild(heading);
        }
        // Insert the container after the input
        instance.input.parentNode.insertBefore(container, instance.input.nextSibling);
        return container;
      },
      createAddressLine: {
        // Create a hidden input to store the address line
        input: function (key, value) {
          // Create a wrapper (and hide it)
          var div = document.createElement("div");
          div.classList.add("hidden");
          div.classList.add("address-line-input");

          // Create the label
          var label = document.createElement("label");
          label.innerHTML = key.replace(/([A-Z])/g, ' $1') //Add space before capital Letters
            .replace(/([0-9])/g, ' $1') //Add space before numbers
            .replace(/^./, function (str) {
              return str.toUpperCase();
            }); //Make first letter of word a capital letter
          div.appendChild(label);

          // Create the input
          var input = document.createElement("input");
          input.setAttribute("type", "text");
          input.setAttribute("name", key);
          input.setAttribute("value", value);
          div.appendChild(input);
          return div;
        },
        // Create a DOM element to contain the address line
        row: function (value) {
          var row = document.createElement("div");
          row.classList.add("toggle");
          row.innerHTML = value;
          return row;
        },
        // Create the address line label based on the country and language
        label: function (key) {
          var label = key;
          var language = instance.language;
          var country = instance.currentCountryCode;
          var translations = ContactDataServices.translations;
          if (translations) {
            try {
              var translatedLabel = translations[language][country][key];
              if (translatedLabel) {
                label = translatedLabel;
              }
            } catch (e) {
              // Translation doesn't exist for key
            }
          }
          return label;
        }
      },
      // Create the 'Edit address' link that allows manual editing of address
      createEditAddressLink: function () {
        var link = document.createElement("a");
        link.setAttribute("href", "#");
        link.classList.add("edit-address-link");
        link.innerHTML = instance.editAddressText;
        // Insert into the formatted address container
        instance.result.formattedAddress.appendChild(link);
        // Bind event listener
        link.addEventListener("click", instance.result.editAddressManually);
      },
      // Create the 'Search again' link that resets the search
      createSearchAgainLink: function () {
        var link = document.createElement("a");
        link.setAttribute("href", "#");
        link.classList.add("search-again-link");
        link.innerHTML = instance.searchAgainText;
        // Insert into the formatted address container
        instance.result.formattedAddress.appendChild(link);
        // Bind event listener
        link.addEventListener("click", instance.reset);
      },
      editAddressManually: function (event) {
        if (event) {
          event.preventDefault();
        }

        // Fire an event to say we're editing the address manually
        instance.events.trigger("post-edit-address-manually");

        // Remove 'edit address link'
        //instance.result.formattedAddress.querySelector(".edit-address-link").classList.add("hidden");

        // Change the visible formatted address to hidden
        instance.toggleVisibility(instance.result.formattedAddress);

        // Change the hidden address line inputs to show to allow editing
        //var addressLineInputs = instance.result.formattedAddress.querySelectorAll(".address-line-input");
        //for (var j = 0; j < addressLineInputs.length; j++) {
        //		addressLineInputs[j].classList.remove("hidden");
        //}
      },
      // Write the list of hidden address line inputs to the DOM
      renderInputList: function (inputArray) {
        if (inputArray.length > 0) {
          for (var i = 0; i < inputArray.length; i++) {
            instance.result.formattedAddress.appendChild(inputArray[i]);
          }
        }
      }
    };

    // Toggle the visibility of elements
    instance.toggleVisibility = function (scope) {
      scope = scope || document;
      var elements = scope.querySelectorAll(".toggle");
      for (var i = 0; i < elements.length; i++) {
        if (elements[i].classList.contains("hidden")) {
          elements[i].classList.remove("hidden");
        } else {
          elements[i].classList.add("hidden");
        }
      }
    };

    instance.searchSpinner = {
      show: function () {
        // Return if we're not displaying a spinner
        if (!instance.useSpinner) {
          return;
        }
        // Create the spinner container
        var spinnerContainer = document.createElement("div");
        spinnerContainer.classList.add("loader");
        spinnerContainer.classList.add("loader-inline");

        // Create the spinner
        var spinner = document.createElement("div");
        spinner.classList.add("spinner");
        spinnerContainer.appendChild(spinner);

        // Insert the spinner after the field
        instance.input.parentNode.insertBefore(spinnerContainer, instance.input.nextSibling);
      },

      hide: function () {
        // Return if we're not displaying a spinner
        if (!instance.useSpinner) {
          return;
        }
        var spinner = instance.input.parentNode.querySelector(".loader-inline");
        if (spinner) {
          instance.input.parentNode.removeChild(spinner);
        }
      }
    };

    // Reset the search
    instance.reset = function (event) {
      if (event) {
        event.preventDefault();
      }
      // Enable searching
      instance.enabled = true;
      // Hide formatted address
      instance.result.hide();
      // Show search input
      instance.toggleVisibility(instance.input.parentNode);
      // Apply focus to input
      instance.input.focus();

      // Fire an event after a reset
      instance.events.trigger("post-reset");
    };

    // How to handle request errors
    instance.handleError = {
      // How to handle 400 Bad Request
      badRequest: function (xhr) {
        instance.enabled = false;

        // As searching is disabled, show button to render final address instead
        instance.handleError.showSubmitButton();

        // Fire an event to notify users of the error
        instance.events.trigger("request-error-400", xhr);
      },

      // How to handle 401 Unauthorized (invalid token?) requests
      unauthorized: function (xhr) {
        instance.enabled = false;

        // As searching is disabled, show button to render final address instead
        instance.handleError.showSubmitButton();

        // Fire an event to notify users of the error
        instance.events.trigger("request-error-401", xhr);
      },

      // How to handle 403 Forbidden requests
      forbidden: function (xhr) {
        instance.enabled = false;

        // As searching is disabled, show button to render final address instead
        instance.handleError.showSubmitButton();

        // Fire an event to notify users of the error
        instance.events.trigger("request-error-403", xhr);
      },

      // How to handle 404 Not Found requests
      notFound: function (xhr) {
        instance.enabled = false;

        // As searching is disabled, show button to render final address instead
        instance.handleError.showSubmitButton();

        // Fire an event to notify users of the error
        instance.events.trigger("request-error-404", xhr);
      },

      // As searching is disabled, show button to render final address instead
      showSubmitButton: function () {
        var button = document.createElement("button");
        button.innerText = "Submit";
        instance.input.parentNode.insertBefore(button, instance.input.nextSibling);
        button.addEventListener("click", function () {
          // Simulate a manual "use address entered" entry
          instance.picklist.useAddressEntered.click();
          // Remove the button
          instance.input.parentNode.removeChild(button);
        });
      }
    };

    // Use this to initiate and track XMLHttpRequests
    instance.request = {
      currentRequest: null,
      get: function (url, callback) {
        instance.request.currentRequest = new XMLHttpRequest();
        instance.request.currentRequest.open('GET', url, true);
        instance.request.currentRequest.timeout = 5000; // 5 seconds


        instance.request.currentRequest.onload = function (xhr) {
          if (instance.request.currentRequest.status >= 200 && instance.request.currentRequest.status < 400) {
            // Success!
            var data = JSON.parse(instance.request.currentRequest.responseText);
            callback(data);
          } else {
            // We reached our target server, but it returned an error
            instance.searchSpinner.hide();

            // Fire an event to notify users of an error
            instance.events.trigger("request-error", xhr);

            // If the request is 400 Bad Request
            if (instance.request.currentRequest.status === 400) {
              instance.handleError.badRequest(xhr);
            }
            // If the request is 401 Unauthorized (invalid token) we should probably disable future requests
            else if (instance.request.currentRequest.status === 401) {
              instance.handleError.unauthorized(xhr);
            }
            // If the request is 403 Forbidden
            else if (instance.request.currentRequest.status === 403) {
              instance.handleError.forbidden(xhr);
            }
            // If the request is 404 Not Found
            else if (instance.request.currentRequest.status === 404) {
              instance.handleError.notFound(xhr);
            }
          }
        };

        instance.request.currentRequest.onerror = function (xhr) {
          // There was a connection error of some sort
          // Hide the inline search spinner
          instance.searchSpinner.hide();

          // Fire an event to notify users of an error
          instance.events.trigger("request-error", xhr);
        };

        instance.request.currentRequest.ontimeout = function (xhr) {
          // There was a connection timeout
          // Hide the inline search spinner
          instance.searchSpinner.hide();

          // Fire an event to notify users of the timeout
          instance.events.trigger("request-timeout", xhr);
        };

        instance.request.currentRequest.send();
      }
    };

    // Initialise this instance of ContactDataServices
    instance.init();

    // Return the instance object to the invoker
    return instance;
  };

})(window, window.document);
