/*
 * Some apple dashboard scripts use .children. Apprently this works in IE and Safari, but not in Mozilla Firefox.
 * Code below makes .children work in FF too.
 */
if (typeof Node != 'undefined') {
  if (typeof Node.children == 'undefined') {
     eval('Node.prototype.children getter = function() {return this.childNodes;}');
  }
}
/**
 * Apple Dashboard widgets expect this object.
 */
var Widget = {
  /****************************************************************
   * this is the code that is written as clean room implementation based on Apple's documentation:
   * http://developer.apple.com/documentation/AppleApplications/Reference/Dashboard_Ref/index.html
   * It is used for the single purpose of allowing to execute existing Dashboard Widgets.
   */

  /**
   * Contains a unique identifier for this instance of the widget.
   * This read-only property contains a string value that is unique among all of the instances of a single widget.
   * This value is assigned by Dashboard and persists between instantiations of each widget instance.
   */
  identifier : new Date().getTime(), // hack - must be persistent between invocations of this widget
  /**
   * Contains the event handler to be called upon the start of a widget drag.
   * Assign a function to this property if you want to be notified when your widget has begun a drag.
   * You use this function to change your widget’s user interface while it is being dragged.
   * Your function declaration should look like the following:
   */
  ondragstart : null,

  /**
   * Contains the event handler to be called upon the finish of a widget drag.
   * Assign a function to this property if you want to be notified when your widget has ended a drag.
   * You use this function to change your widget’s user interface after it has been dragged.
   * Your function declaration should look like the following:
   */

  ondragend : null,

  /**
   * Contains the event handler to be called when the Dashboard layer is hidden.
   * Assign a function to this property if you want to be notified when your widget is hidden.
   * You use this function to deactivate your widget and put it into a quiescent state.
   * Your function declaration should look like the following:
   *   function MyHiddenHandler() { ... }
   */
  onhide : null,

  /**
   * Contains the function to be called when your widget is removed from the Dashboard layer.
   * Assign a function to this property if you want to be notified when your widget is removed from the Dashboard layer.
   * Upon receiving this event, your widget should perform any necessary cleanup operations, such as save its preferences,
   * remove cache files, and release any resources it currently holds. Your function declaration should look like the following:
   *   function MyRemoveHandler() { ... }
   */
  onremove : null,

  /**
   * Contains the function to be called when the Dashboard layer is shown.
   * Assign a function to this property if you want to be notified when your widget is shown.
   * You use this function to activate your widget and begin processing data again after being quiescent.
   * Your function declaration should look like the following:
   *  function MyShowHandler() { ... }
   */
  onshow: null,


  /**
   * Launches the application with the specified bundle identifier.
   * Use this method to launch the application indicated by bundleId on the target system. Calling this method dismisses the Dashboard layer.
   */
  openApplication: function openApplication(bundleId) {
    return;
  },

  /**
   * Opens the specified URL in the user’s preferred browser.
   * This method opens the specified URL and dismisses the Dashboard layer. This method does not permit the opening of URLs that use the file: scheme unless the AllowFileAccessOutsideOfWidget key is set in the widget’s information property list file.
   */
  openURL: function openURL(url) {
    document.location.href = url;
  },

  /**
   * Returns the preference associated with the specified key.
   * Use this method to retrieve a preference value previously stored with a call to setPreferenceForKey.
   * The method returns a string with the contents of the preference, or undefined if no such preference exists.
   */
  preferences : new Array(),

  preferenceForKey: function preferenceForKey(key) {
    return preferences(key);
  },

  /**
   * Associates a preference with the given key.
   * The preference and key parameters contain strings representing the preference you want to store and the key with which you want to associate it. Specifying null for the preference parameter removes the specified key from the preferences.
   * Preferences saved using setPreferenceForKey are saved as clear text and therefore are not recommended for saving passwords or other sensitive information.
   */
  setPreferenceForKey: function setPreferenceForKey(preference, key) {
    preferences(key) = preference;
  },

  /**
   * Runs an animation to toggle between your widget’s reverse and contents.
   * You call this method after first calling prepareForTransition, which indicates whether you are displaying your widget’s reverse side or contents.
   * When you call performTransition, Dashboard begins an animation that makes the widget appear to flip over and display the new content.
   * Prior to calling this method, you should also adjust the style sheet properties of your HTML to reflect the change in what is about to be displayed. For example, before calling this method to show your reverse side, you should show the HTML elements associated with your reverse side and hide those elements associated with your widget’s contents.
   */
  prepareForTransition: function prepareForTransition() {
    return;
  },

  /**
   * Runs an animation to toggle between your widget’s reverse and contents.
   * You call this method after first calling prepareForTransition, which indicates whether you are displaying your widget’s reverse side or contents.
   * When you call performTransition, Dashboard begins an animation that makes the widget appear to flip over and display the new content.
   * Prior to calling this method, you should also adjust the style sheet properties of your HTML to reflect the change in what is about to be displayed.
   * For example, before calling this method to show your reverse side,
   * you should show the HTML elements associated with your reverse side and hide those elements associated with your widget’s contents.
   */
  performTransition: function performTransition() {
    return;
  },

  /**
   * Changes the location of the widget close box.
   * Use this method to move your widget’s close box.
   * This method centers the close box x pixels from the left edge of the widget and y pixels down from the top of the widget.
   * Only values between 0 and 100 are allowed for x and y.
   */
  setCloseBoxOffset: function setCloseBoxOffset(x, y) {
    return;
  },

  /**
   * Executes a command-line utility.
   * The command parameter is a string that specifies a command utility to be executed.
   * It should specify a full or relative path to the command-line utility and include any arguments. For example:
   * widget.system("/usr/bin/id -un", null);
   * The endHandler parameter specifies a handler to be called when the command has finished executing.
   * If NULL, the entire method is run synchronously, meaning that all execution inside the widget halts until the command is finished.
   * When running synchronously, these options are available:
   * If endHandler is specified, the command is run asynchronously, meaning that the command runs concurrently and the handler is called when execution is finished.
   * When run asynchronously, widget.system returns an object that can be saved and used to perform other operations upon the command:
   * Note: To use widget.system, you need to set the AllowSystem key in your Info.plist. For more information, see “Dashboard Info.plist Keys.”
   */
  system: function system(command, endHandler) {
    return;
  }
}

if (!window.widget)
  window.widget = Widget;
