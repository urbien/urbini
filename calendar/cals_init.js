// initialization block for all calendars on the page
// A_CALENDARS array contains references to each calendar instance

try {
  if (typeof A_CALENDARS != 'undefined' && A_CALENDARS != null) {
    for (var n = 0; n < A_CALENDARS.length; n++) {
      A_CALENDARS[n].create();
    }
  }
}
catch (e) {}
