(function () {
  "use strict";

  // Groups considered "high intensity" get the rust accent, everything
  // else gets navy. Extend this list if you add new group folder names.
  var HIGH_INTENSITY_GROUPS = ["plyometric", "power", "conditioning"];

  // Categories with more groups than this are treated as sub-navigation:
  // one group (e.g. one body part) shown at a time, picked via chips,
  // instead of every group stacked on the page. This is what turns
  // "daily" (6 body-part subcategories) into a two-level nav while
  // "legs" (2 groups) or "rest-day" (3 groups) stay single-page.
  var SUBNAV_GROUP_THRESHOLD = 3;

  var categoryBar = document.getElementById("category-bar");
  var panel = document.getElementById("routine-panel");

  var data = null;
  var activeCategory = null;
  var activeSubgroup = null;

  fetch("exercises.json")
    .then(function (res) {
      if (!res.ok) throw new Error("could not load exercises.json");
      return res.json();
    })
    .then(function (json) {
      data = json;
      renderCategoryBar();
      var firstKey = Object.keys(data)[0];
      if (firstKey) selectCategory(firstKey);
    })
    .catch(function (err) {
      panel.innerHTML =
        '<p class="empty-state">Could not load exercises.json. ' +
        "Run <code>python3 generate.py</code> and reload.</p>";
      console.error(err);
    });

  function renderCategoryBar() {
    categoryBar.innerHTML = "";
    Object.keys(data).forEach(function (key) {
      var btn = document.createElement("button");
      btn.className = "category-btn";
      btn.type = "button";
      btn.textContent = data[key].label;
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        selectCategory(key);
      });
      categoryBar.appendChild(btn);
    });
  }

  function selectCategory(key) {
    activeCategory = key;
    activeSubgroup = null;

    Array.prototype.forEach.call(
      categoryBar.querySelectorAll(".category-btn"),
      function (btn) {
        var isActive = btn.textContent === data[key].label;
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      }
    );

    renderPanel(data[key]);
  }

  function renderPanel(category) {
    panel.innerHTML = "";
    var groupKeys = Object.keys(category.groups);

    if (groupKeys.length === 0) {
      panel.innerHTML = '<p class="empty-state">No exercises added here yet.</p>';
      return;
    }

    if (groupKeys.length > SUBNAV_GROUP_THRESHOLD) {
      renderSubnavPanel(category, groupKeys);
    } else {
      groupKeys.forEach(function (groupKey) {
        panel.appendChild(buildGroupSection(groupKey, category.groups[groupKey]));
      });
    }
  }

  function renderSubnavPanel(category, groupKeys) {
    if (!activeSubgroup || groupKeys.indexOf(activeSubgroup) === -1) {
      activeSubgroup = groupKeys[0];
    }

    var subnav = document.createElement("div");
    subnav.className = "subnav-bar";

    groupKeys.forEach(function (groupKey) {
      var chip = document.createElement("button");
      chip.className = "subnav-chip";
      chip.type = "button";
      chip.textContent = category.groups[groupKey].label;
      chip.setAttribute("aria-pressed", groupKey === activeSubgroup ? "true" : "false");
      chip.addEventListener("click", function () {
        activeSubgroup = groupKey;
        renderPanel(category);
      });
      subnav.appendChild(chip);
    });

    panel.appendChild(subnav);

    var body = document.createElement("div");
    body.className = "subnav-body";
    body.appendChild(buildGroupSection(activeSubgroup, category.groups[activeSubgroup]));
    panel.appendChild(body);
  }

  function buildGroupSection(groupKey, group) {
    var tone = HIGH_INTENSITY_GROUPS.indexOf(groupKey) !== -1 ? "rust" : "navy";

    var section = document.createElement("section");
    section.className = "group";
    section.dataset.tone = tone;

    var heading = document.createElement("div");
    heading.className = "group-heading";
    heading.innerHTML =
      "<h2>" + escapeHtml(group.label) + "</h2><div class=\"rule\"></div>";
    section.appendChild(heading);

    var grid = document.createElement("div");
    grid.className = "card-grid";

    group.exercises.forEach(function (exercise, index) {
      grid.appendChild(buildCard(exercise, index));
    });

    section.appendChild(grid);
    return section;
  }

  function buildCard(exercise, index) {
    var card = document.createElement("article");
    card.className = "exercise-card";

    var mediaFrame = document.createElement("div");
    mediaFrame.className = "media-frame";

    var tag = document.createElement("span");
    tag.className = "card-tag";
    tag.textContent = String(index + 1).padStart(2, "0");
    mediaFrame.appendChild(tag);

    if (exercise.media && exercise.media.type === "video") {
      var video = document.createElement("video");
      video.src = exercise.media.src;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      mediaFrame.appendChild(video);
    } else if (exercise.media && exercise.media.type === "image") {
      var img = document.createElement("img");
      img.src = exercise.media.src;
      img.alt = exercise.name;
      mediaFrame.appendChild(img);
    } else {
      var placeholder = document.createElement("p");
      placeholder.className = "media-placeholder";
      placeholder.textContent = "No video or image yet";
      mediaFrame.appendChild(placeholder);
    }

    if (exercise.prescription) {
      var rx = document.createElement("span");
      rx.className = "rx-tag";
      rx.textContent = exercise.prescription;
      mediaFrame.appendChild(rx);
    }

    var body = document.createElement("div");
    body.className = "card-body";

    var titleRow = document.createElement("div");
    titleRow.className = "card-title-row";

    var title = document.createElement("h3");
    title.textContent = exercise.name;
    titleRow.appendChild(title);

    var doneBtn = document.createElement("button");
    doneBtn.className = "done-toggle";
    doneBtn.type = "button";
    doneBtn.setAttribute("aria-label", "Mark " + exercise.name + " as done");
    doneBtn.innerHTML = "<span>&#10003;</span>";
    doneBtn.addEventListener("click", function () {
      card.classList.toggle("is-done");
    });
    titleRow.appendChild(doneBtn);

    body.appendChild(titleRow);

    if (exercise.notes) {
      var notesToggle = document.createElement("button");
      notesToggle.className = "notes-toggle";
      notesToggle.type = "button";
      notesToggle.setAttribute("aria-expanded", "false");
      notesToggle.innerHTML = "Notes <span>&#8964;</span>";

      var notesBody = document.createElement("p");
      notesBody.className = "notes-body";
      notesBody.textContent = exercise.notes;

      notesToggle.addEventListener("click", function () {
        var isOpen = notesBody.classList.toggle("is-open");
        notesToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      body.appendChild(notesToggle);
      body.appendChild(notesBody);
    }

    card.appendChild(mediaFrame);
    card.appendChild(body);
    return card;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
