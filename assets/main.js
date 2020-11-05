$('#periodContainer').hide()
var viewSelectChanged = false;

// Watsons Ticket Fields ID
// var ticketChannel = '360023234893';
// var ticketType = '360000056874';
// var ticketCase = '360000054533';
// var ticketCategory = '114103812473';

// Rokitv Ticket Fields ID
var ticketChannel = '45197428';
var ticketType = '45286427';
var ticketCase = '45197648';
var ticketCategory = '45197668';

var delimiterValue = '0';
var ticketCounter = 0;
var modal = document.getElementById("myModal");

var isUsingPeriod = false;

var fromDate = '';
var toDate = '';

var client = ZAFClient.init();
let csvContent = "data:text/csv;charset=utf-8,";
let ticketFormName = '';
var ticketRow = [];
var ticketFieldsrow = [];

client.request('/api/v2/ticket_forms.json').then(
    function(forms) {
    for (var i=0; i<forms.ticket_forms.length; i++) {
        if (forms.ticket_forms[i].active) {
        $("#viewOption").append(new Option(forms.ticket_forms[i].name, forms.ticket_forms[i].name));
        }
    }
    client.request('/api/v2/ticket_fields.json').then (
        function(customFields) {
        for (var i=0; i<customFields.ticket_fields.length; i++) {
            if (customFields.ticket_fields[i].active) {
            ticketFieldsrow.push({
                id: customFields.ticket_fields[i].id,
                title: customFields.ticket_fields[i].title
            })
            }
        }
        $("#btnExport").attr("disabled", false);
    },
    function(response) {
        console.error(response);
    });
    },
    function(response) {
    console.error(response.responseText);
    });

function changeViews (forms) {
    var formName = forms.value;
    ticketFormName = formName;
    viewSelectChanged = true;
}

function onPeriodChange (select) {
    if (select.value == 'all') {
        isUsingPeriod = false;
        $('#periodContainer').hide()
    } else {
        isUsingPeriod = true;
        $('#periodContainer').show()
    }
}

function changeDelimiter (delimiter) {
    delimiterValue = delimiter.value;
}

function onFromChange (fromDateInput) {
    fromDate = fromDateInput.value + 'T00:00:00Z'
}

function onToChange (toDateInput) {
    toDate = toDateInput.value + 'T23:59:59Z'
}

function doExport () {
    csvContent = '';
    var addPeriod = '';
    if (isUsingPeriod) {
        addPeriod = 'created>' + fromDate + ' created<' + toDate;
    }
    if (viewSelectChanged) {
        ticketCounter = 0;
        var ticketViewUrl = '/api/v2/search.json?query=type%3Aticket%20form:"' + ticketFormName + '" ' + addPeriod;
        // console.log(ticketViewUrl)

        if (ticketFormName != '') {
            $('#myModal').modal('show');
            $("#btnExport").attr("disabled", true);
        }
        generateTickets(ticketViewUrl);
        ticketRow = [];

    } else {
        alert('Select Ticket Form') 
    }
}

function generateTickets (url) {
    console.log('generating ticket')
    console.log(url)
    client.request(url).then(
    function(tickets) {
        tickets.results.forEach((ticket, index) => {
        ticketCounter++;

        if (index == 0) {
            Object.keys(ticket).forEach(function(key) {
                if (!key.includes('custom_fields') && !(key.includes('fields'))) {
                    csvContent += '"' + key + '",';
                }
            });

            ticket.custom_fields.forEach(custom_fields => {
                let customFieldsObject = ticketFieldsrow.find(fieldsRow => fieldsRow.id === custom_fields.id);
                csvContent += '"' + customFieldsObject.title + '",';
            });
            csvContent += "\r\n";
        }
        
        Object.keys(ticket).forEach(function(key) {
            if (!key.includes('custom_fields') && !(key.includes('fields'))) {
            csvContent += '\"' +  ticket[key] + '\",'
            }
        });
        ticket.custom_fields.forEach(custom_fields => {
            csvContent += '"' + custom_fields.value + '",';
        });
        csvContent += "\r\n";

        });

        // for (var i=0; i<tickets.results.length; i++) {
        //   ticketRow.push(tickets.results[i]);
        // }

        $("#ticket_info").text("Getting tickets.. (" + ticketCounter + "/" + tickets.count + ")");

        if (tickets.next_page != null) {
            generateTickets(tickets.next_page);
        } else {
            var newDelimiter = '';
            if (delimiterValue == '0') {
                newDelimiter = ';';
            } else {
                newDelimiter = ',';
            }
        // csvContent += "Ticket ID" + newDelimiter + "Subject (Raw)" + newDelimiter + "Created at" + newDelimiter + "Updated at" + newDelimiter + "Status" + newDelimiter + "Channel" + newDelimiter + "Ticket Channel" + newDelimiter + "Case" + newDelimiter + "Type" + newDelimiter + "Category\r\n"
        // ticketRow.forEach(function(rowArray) {
        //     let row = rowArray.join(newDelimiter);
        //     csvContent += row + "\r\n";
        // });

            var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement("a");
            if (link.download !== undefined) {
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", ticketFormName + "_EXPORT_ " + Math.random().toString(36).substr(2, 5) + ".csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                $('#myModal').modal('hide');
            }
            $("#btnExport").attr("disabled", false);
        }
    },
    function(response) {
        console.error(response.responseText);
        // console.log("cobain");
        $('#myModal').modal('hide');
        $("#btnExport").attr("disabled", false);
    }
    );
}

// client.invoke('resize', { width: '100%', height: '200px' });