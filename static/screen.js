$(document).ready(function () {
  function editRow(button) {
    var row = button.closest("tr");
    Array.from(row.cells).forEach((cell, index) => {
      if (index < row.cells.length - 1) {
        cell.setAttribute("contenteditable", "true");
        cell.classList.add("editable-cell");
      }
    });
    button.textContent = "Kaydet";
    button.className = "btn btn-warning btn-save"; // Butonun class'ını değiştir
  }

  function saveRow(button) {
    var row = button.parentNode.parentNode;
    Array.from(row.cells).forEach((cell, index) => {
      if (index < row.cells.length - 1) {
        cell.setAttribute("contenteditable", "false");
        cell.classList.remove("editable-cell");
      }
    });
    button.textContent = "Düzenle";
    button.className = "btn btn-success"; // Butonun class'ını geri değiştir
  }

  function deleteRow(button) {
    var row = button.closest("tr");
    row.remove();
  }

  // Olay delegasyonları
  $("#editableTable").on("click", "button.btn-success", function () {
    editRow(this);
  });
  $("#editableTable").on("click", "button.btn-danger", function () {
    deleteRow(this);
  });
  $("#editableTable").on("click", "button.btn-save", function () {
    saveRow(this);
  });

  $(document).ready(function () {
    // Form gönderimini yakala
    $("form").on("submit", handleFormSubmission);
  });

  function handleFormSubmission(event) {
    event.preventDefault();
    $("#loadingGif").show(); // GIF'i göster
    let formData = new FormData(this);

    $.ajax({
      url: "/show_table",
      method: "POST",
      data: formData,
      processData: false,
      contentType: false,
      success: function (response) {
        populateTableWithResponse(response);
        $("#loadingGif").hide(); // GIF'i gizle
      },
    });
  }

  function populateTableWithResponse(response) {
    const tableData = response.sonuc;
    const yasaklilar = response.yasakli;
    $("#yasaklidivi").show();
    $("#butonekle").show();
    $("#butonekle2").show();

    yasaklilar.forEach((veri) => {
      row2 = ` <td>${veri}  </td>      `;
      $("#yasaklilar").append(row2);
    });

    // Tabloyu temizle ve göster
    $("#editableTable tbody").empty();

    tableData.forEach((data) => {
      const row = `
    <tr>
        <td>${data["sira"]}</td>
        <td>${data["kod"]}</td>
        <td>${data["suctarihi"]}</td>
        <td>${data["hukum"]}</td>
        <td>${data["mahkeme"]}</td>
        <td>${data["karar"]}</td>
        <td>${data["ktarihi"]}</td>
        <td>${data["esayisi"]}</td>
        <td>${data["ksayisi"]}</td>
        <td>${data["kesinlesme"]}</td>
        <td><button type="button" class="btn btn-success" onclick="editRow(this)">Düzenle</button></td>
        <td><button type="button" class="btn btn-danger" onclick="deleteRow(this)">Sil</button></td>
    </tr>`;
      $("#editableTable tbody").append(row);
      //checkTableSize();
    });
  }
  // Satır ekleme butonunun click event'ini tanımla
  $("#addRowButton").click(function () {
    const emptyRow = `
        <tr>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td contenteditable="false"></td>
            <td><button type="button" class="btn btn-success" onclick="editRow(this)">Düzenle</button></td>
            <td><button type="button" class="btn btn-danger" onclick="deleteRow(this)">Sil</button></td>
        </tr>`;
    $("#editableTable tbody").append(emptyRow);
  });

  // butonekle2 ID'li butona tıklandığında çalışacak fonksiyon
  $("#butonekle2").click(function () {
    const selectedDate = document.getElementById("startDate").value;
    const totalColumns = document.querySelectorAll(
      "#editableTable thead th"
    ).length;
    const tableData = Array.from(
      document.querySelectorAll("#editableTable tbody tr")
    ).map((row) => {
      const rowData = {};
      row.querySelectorAll("td").forEach((cell, index) => {
        // Son iki sütunu hariç tutun
        if (index < totalColumns - 2) {
          const columnHeader = document.querySelector(
            `#editableTable thead th:nth-child(${index + 1})`
          ).textContent;
          rowData[columnHeader] = cell.textContent;
        }
      });
      return rowData;
    });
    console.log(tableData);

    fetch("/update-table", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: tableData, reference_date: selectedDate }),
    })
      .then((response) => response.json())
      .then((data) => {
        populateResultsTable(data.results);
      });
    function populateResultsTable(results) {
      const tbody = document.querySelector("#editableTable2 tbody");
      tbody.innerHTML = ""; // Mevcut içeriği temizleyelim

      results.forEach((result) => {
        const row = `
<tr>
    <td>${result["sira"]}</td>
    <td>${result["kod"]}</td>
    <td>${result["suctarihi_str"]}</td>
    <td>${result["hukum"]}</td>
    <td>${result["mahkeme"]}</td>
    <td>${result["karar"]}</td>
    <td>${result["ktarihi_str"]}</td>
    <td>${result["esayisi"]}</td>
    <td>${result["ksayisi"]}</td>
    <td>${result["kesinlesme_str"]}</td>
</tr>`;
        tbody.innerHTML += row;
      });
    }
  });
});

document.querySelectorAll("#editableTable th .resizer").forEach((resizer) => {
  let startX, startWidth, index;

  resizer.addEventListener("mousedown", (e) => {
    startX = e.pageX;
    const th = resizer.parentElement;
    startWidth = th.offsetWidth;
    index = Array.prototype.indexOf.call(th.parentNode.children, th);

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  });

  function mouseMoveHandler(e) {
    const newWidth = startWidth + e.pageX - startX;
    const th = resizer.parentElement;
    th.style.width = newWidth + "px";

    // Aynı indexe sahip tüm sütun hücrelerini güncelle
    Array.from(document.querySelectorAll("#editableTable tr")).forEach(
      (row) => {
        const cell = row.cells[index];
        if (cell) {
          cell.style.width = newWidth + "px";
        }
      }
    );
  }

  function mouseUpHandler() {
    document.removeEventListener("mousemove", mouseMoveHandler);
    document.removeEventListener("mouseup", mouseUpHandler);
  }
});
