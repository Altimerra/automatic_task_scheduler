/* -------------------------------------------------------------------------- */
/*                             Object definitions                             */
/* -------------------------------------------------------------------------- */

function Task(name, timeobj, urgency = 0, repeat = 0) {
    this.name = name
    this.created = new Date()
    this.id = generate()
    this.time = timeobj
    this.urgency = urgency
    this.scheduled = false
    this.repeat = repeat
    this.completed = false

}

function Timeblock(startTime, endTime, type = 0) {
    this.startTime = startTime
    this.endTime = endTime
    this.type = type
    this.time = timeDifference(this.startTime, this.endTime)
    this.tasks = []
    this.availableTime = timeDifference(this.startTime, this.endTime)
}

function DayStructure(name, timeblocks) {
    this.name = name
    this.id = generate()
    this.timeblocks = timeblocks
}

function Day(name, daystructure) {
    this.name = name
    this.id = generate()
    this.date = new Date()
    this.timeblocks = createTimeblocks(daystructure)
}

function Time(hours, minutes) {
    this.hours = Number(hours)
    this.minutes = Number(minutes)
    this.timeAmount = this.hours * 60 + this.minutes
}

/* --------------------- functions required for objects --------------------- */

function idGenerator() {
    //cannot create more than 99 ids in one milisecond
    let id = 0

    return function () {
        return Date.now().toString() + (id++).toString().padStart(2, '0')
    }
}
generate = idGenerator() //closure initialization

function timeDifference(time1, time2) {
    let larger
    let smaller
    if ((time1.hours * 100 + time1.minutes) > (time2.hours * 100 + time2.minutes)) {
        larger = time1
        smaller = time2
    } else {
        larger = time2
        smaller = time1
    }

    let newhours = larger.hours - smaller.hours
    let newminutes = larger.minutes - smaller.minutes
    if (newminutes < 0) {
        newhours--
        newminutes = 60 + newminutes
    }
    return new Time(newhours, newminutes)
}

function createTimeblocks(daystructure) {
    let timeblocksArray = []
    for (timeblock of daystructure.timeblocks) {
        timeblocksArray.push(new Timeblock(timeblock.startTime, timeblock.endTime, timeblock.type))
    }
    return timeblocksArray

}

/* -------------------------------------------------------------------------- */
/*                           Main scheduler object                            */
/* -------------------------------------------------------------------------- */

scheduler = {
    taskarray: [],
    day: null,
    //the following two arrays are not used at the moment
    notScheduled: [],
    scheduledTasks: [],
    scheduleForTimeblock: function (timeblock) {
        for (i = 0; i < this.taskarray.length; i++) {
            let task = this.taskarray[i]
            if (timeblock.availableTime.timeAmount >= task.time.timeAmount && task.scheduled == false) {
                task.scheduled = true
                timeblock.availableTime = timeDifference(timeblock.availableTime, task.time)
                timeblock.tasks.push(task)
            }
        }
    },

    scheduleForDay: function () {
        let timeblocks = this.day.timeblocks
        for (timeblock of timeblocks) {
            this.scheduleForTimeblock(timeblock)
        }
    },
    arrangeTasks: function () {
        this.notScheduled.splice(0, this.notScheduled.length)
        this.scheduledTasks.splice(0, this.scheduledTasks.length)
        for (task of this.taskarray) {
            if (task.scheduled == true) {
                this.scheduledTasks.push(task)
            }
            if (task.scheduled == false) {
                this.notScheduled.push(task)
            }
        }
    },
}

/* -------------------- functions required for scheduler -------------------- */

function pushNewTask(task) {
    scheduler.taskarray.push(task)
}

function removeTask(taskid) {
    let taskarray = scheduler.taskarray
    for (i = 0; i < taskarray.length; i++) {
        if (taskarray[i].id == taskid) {
            taskarray.splice(i, 1)
        }
    }
}
/* -------------------------------------------------------------------------- */
/*                              Interface objects                             */
/* -------------------------------------------------------------------------- */

tasklist = {
    dom: document.getElementById("tasklist"),
    listClass: "list-group-item d-flex",
    listTextClass: "mr-auto",
    badgeSpanClass: "mr-2",
    badgeClass: "badge badge-dark",
    buttonClass: "btn btn-danger btn-sm btn-xs",
    iconClass: "material-icons",
    iconName: "close",
    createElement: function (element) {
        /*
        <li class="list-group-item d-flex" id="something">   
            <span class="mr-auto">List item</span>
            <span>
                <span class="mr-2"><span class="badge badge-dark">1h 15m</span></span>
                <button type="button" class="btn btn-danger btn-sm btn-xs" onclick="handleTasklistClose(this)">
                <span class="material-icons">close</span>
                </button>
            </span>
        </li>
        */
        let newListItem = document.createElement("li")
        newListItem.setAttribute("id", element.id)
        newListItem.setAttribute("class", this.listClass)

        let textSpan = document.createElement("span")
        textSpan.setAttribute("class", this.listTextClass)
        textSpan.innerHTML = element.name
        newListItem.appendChild(textSpan)

        let secondSpan = document.createElement("span")

        let badgeSpan = document.createElement("span")
        badgeSpan.setAttribute("class", this.badgeSpanClass)
        let badge = document.createElement("span")
        badge.setAttribute("class", this.badgeClass)
        badge.innerHTML = element.time.hours.toString() + 'h ' + element.time.minutes.toString() + 'm'
        badgeSpan.appendChild(badge)
        secondSpan.appendChild(badgeSpan)

        let closeButton = document.createElement("button")
        closeButton.setAttribute("type", "button")
        closeButton.setAttribute("class", this.buttonClass)
        closeButton.setAttribute("onclick", "handleTasklistClose(this)")
        let icon = document.createElement("span")
        icon.setAttribute("class", this.iconClass)
        icon.innerHTML = this.iconName
        closeButton.appendChild(icon)

        secondSpan.appendChild(closeButton)
        newListItem.appendChild(secondSpan)

        return newListItem
    },
    addElement: function (element) {
        this.dom.appendChild(this.createElement(element))
    },
    removeElement: function (element) {
        element.remove()
    }
}

taskform = {
    taskname: document.getElementById("taskname"),
    taskhours: document.getElementById("taskhours"),
    taskminutes: document.getElementById("taskminutes"),
    createTask: function () {
        if (this.taskname.value == "") {
            $('#taskname').popover("show")
        } else if (this.taskhours.value == 0 && this.taskminutes.value == 0) {
            $('#taskminutes').popover("show")
        } else {
            let newTask = new Task(this.taskname.value, new Time(this.taskhours.value, this.taskminutes.value))
            this.taskname.value = ""
            this.taskhours.value = 0
            this.taskminutes.value = 0
            return newTask
        }
    }
}

timeblockform = {
    timeblockstart: document.getElementById("timeblockstart"),
    timeblockend: document.getElementById("timeblockend"),
    createTimeblock: function () {
        if (this.timeblockstart.value == "") {
            $('#timeblockstart').popover("show")
        }
        if (this.timeblockend.value == "") {
            $('#timeblockend').popover("show")
        }
        else {
            let newTimeblock = new Timeblock(timeStringToObject(this.timeblockstart.value), timeStringToObject(this.timeblockend.value))
            return newTimeblock
        }



    }
}

timeblocksList = {
    dom: document.getElementById("timeblockslist")
}

/* ---------------- functions required for interface objects ---------------- */

function timeStringToObject(timestring) {
    let timeObj = new Time(timestring.slice(0, 2), timestring.slice(-2))
    return timeObj
}

/* -------------------------------------------------------------------------- */
/*                               Initialization                               */
/* -------------------------------------------------------------------------- */

/* ---------------------- Set options for select input ---------------------- */

function setOptions() {
    let selectHours = document.getElementById("taskhours")
    for (i = 0; i < 7; i++) {
        let newOption = document.createElement("option")
        newOption.setAttribute("value", i.toString())
        newOption.innerHTML = i.toString()
        selectHours.appendChild(newOption)
    }

    let selectMinutes = document.getElementById("taskminutes")
    for (i = 0; i < 60; i = i + 5) {
        let newOption = document.createElement("option")
        newOption.setAttribute("value", i.toString())
        newOption.innerHTML = i.toString()
        selectMinutes.appendChild(newOption)
    }
}

/* -------------------------- Button click handlers ------------------------- */
//initialized in html
function handleTaskAddClick() {
    let newTask = taskform.createTask()
    if (newTask) {
        pushNewTask(newTask)
        tasklist.addElement(newTask)
    }
}
function handleTimeblockAddClick() {
    let newTimeblock = timeblockform.createTimeblock()
    if (newTimeblock) {

    }
}

function handleTasklistClose(closebutton) {
    var mainelement = closebutton.parentNode.parentNode
    removeTask(mainelement.id)
    tasklist.removeElement(mainelement)
}
/* ------------------------------ Init function ----------------------------- */

$(document).ready(function () {
    setOptions()
    //popover functionality
    $('#taskname').popover({ animation: true, trigger: 'manual', content: 'This field is empty' })
    $('#taskminutes').popover({ animation: true, trigger: 'manual', content: 'This field is empty' })
    $('#timeblockstart').popover({ animation: true, trigger: 'manual', content: 'This field is empty' })
    $('#timeblockend').popover({ animation: true, trigger: 'manual', content: 'This field is empty' })
    $('#taskname').click(function () {
        $('#taskname').popover("hide")
    })
    $('#taskminutes').click(function () {
        $('#taskminutes').popover("hide")
    })
    $('#taskhours').click(function () {
        $('#taskminutes').popover("hide")
    })
    $('#timeblockstart').click(function () {
        $('#timeblockstart').popover("hide")
    })
    $('#timeblockend').click(function () {
        $('#timeblockend').popover("hide")
    })
})

/* -------------------------------------------------------------------------- */
