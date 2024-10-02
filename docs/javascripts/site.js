// Config
const FILTER_INPUT_SELECTOR = ".custom_dt_filter";
const FILTER_SEARCH_SELECTOR = "#custom_dt_search";
let table;

// This script is used both within mkdocs and in standalone html files.
// As such, a uniform listener to page load event is required.
// The snippet below uses mkdocs subscription if present otherwise jquery is used
// as a fallback.
// see: https://github.com/squidfunk/mkdocs-material/issues/5816#issuecomment-1667654560

if (typeof document$ == "undefined") {
  document$ = {};
  document$.subscribe = $(document).ready;
}

document$.subscribe(() => {
  initDataTable();

  if (table) {
    // Listen for changes to filters
    $(FILTER_INPUT_SELECTOR).on("change", filterRows);

    $(FILTER_SEARCH_SELECTOR).on("input", filterRows);

    // Apply preselected filters (if present) on page load
    filterRows();

    // Listen for copy event
    listenForClipboardCopy();
  }

  // Setup up select 2
  $(`select${FILTER_INPUT_SELECTOR}`).select2();
});

const initDataTable = () => {
  // Only pages where a table is present.
  if (!$("#test_table").length) return false;

  // Setup DataTable plugin
  // https://datatables.net/reference/api/
  table = new DataTable("#test_table", {
    scrollX: true,
    autoWidth: false,
    layout: {
      topStart: {
          buttons: ['colvis']
      }
    }
  });
};

// A custom DataTable filter is implemented using a <select> tag with the following requirements:
// - It must have the `FILTER_INPUT_SELECTOR` class.
// - It must include a `data-criteria` attribute that specifies the criteria this filter looks for.
//
// Example:
// <select class="<FILTER_INPUT_SELECTOR>" data-criteria="fork"></select>
//
// The value of the `data-criteria' attribute must match the corresponding data attribute in the <tr> elements.
// For instance, rows containing <tr data-fork="..."> will be filtered based on this selection.
const filterRows = () => {
  table
    .rows()
    .search(function (rowContent, b, index) {
      const row = $(table.row(index).node());
      let match = true;

      const searchKeyword = $(FILTER_SEARCH_SELECTOR).val();
      const searchHit = rowContent.includes(searchKeyword);

      for (let filter of $(FILTER_INPUT_SELECTOR)) {
        // Filter is ignored if set to all
        if ($(filter).val() == "all") continue;

        // Otherwise, the result of this filter applied to the previous match.
        match =
          match && row.data($(filter).data("criteria")) === $(filter).val();
      }

      return searchKeyword.length ? match && searchHit : match;
    })
    .draw();
};

const listenForClipboardCopy = () => {
  // Event delegation for copy-to-clipboard functionality
  document.addEventListener("click", function (event) {
    if (event.target && event.target.classList.contains("copy-id")) {
      const fullId = event.target.getAttribute("data-full-id");

      // Copy to clipboard
      navigator.clipboard
        .writeText(fullId)
        .then(() => {
          const originalContent = event.target.innerHTML;

          // Set the sliding message with animation
          event.target.innerHTML =
            '<span class="slide show">...full test id copied!</span>';

          // Delay the hiding of the slide-out message
          setTimeout(() => {
            const slideElement = event.target.querySelector(".slide");
            if (slideElement) {
              slideElement.classList.add("hide");
            }
          }, 1000);

          // Restore the original content after the animation
          setTimeout(() => {
            event.target.innerHTML = originalContent;
          }, 1500); // Total duration before restoring original content
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    }
  });
};
