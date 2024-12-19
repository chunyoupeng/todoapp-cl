/**
 * UI events
 */
export class TodolistUI {
    constructor (api) {
        this.api = api;
    };

    init () {
        this.api.getGroupsList().done((data) => {
	    console.log("Initing UI")
            data.forEach(i => {
                // Draw all groups button
                $(".todolist-groups-wrapper")
                    .append(this.generateGroupElement(i));
            });
	    console.log(data)
            this.selectGroup(data[0]["ID"]);
	    //	    this.selectGroup(data[0]["NAME"]);
            // Select group event
            $(".todolist-wrapper")
                .on("click", ".todolist-group-button .group-name", 
                    (event) => this.selectGroupClick(event));
	    $(".todolist-groups-wrapper")
		.on("click", ".todolist-group-button .group-element-tool .edit",
		    (event) => this.editGroup(event))
	    
	    $(".todolist-body").on('change', '.task-status', (event) => {
		// 获取新状态
		const newStatus = $(event.target).val();

		// 找到包含 data 属性的父元素 .task-element
		const $taskElement = $(event.target).closest('.task-element');

		// 获取 data-group 和 data-id 的值
		const groupId = $taskElement.data('group');
		const todoId  = $taskElement.data('id');

		// 调用更新函数并传入 groupId, todoId, newStatus
		this.updateTaskStatus(groupId, todoId, newStatus);
	    });

		    
            // Delete group event
            $(".todolist-wrapper")
                .on("click", ".group-element-delete", 
                    (event) => this.deleteGroup(event));

            // Delete todo event
            $(".todolist-body")
                .on("click", ".task-element .task-element-delete img", 
                    (event) => this.deleteTodo(event));

            // Edit todo event
            $(".todolist-body")
                .on("click", ".task-element .task-element-edit img", 
                    (event) => this.editTodo(event));

            // Create new task event
            $(".todolist-create-button")
                .click(() => this.showCreateTask());
	    
            $(".group-create-button")
                .click(() => this.createGroup());

            // Search event
            $("#search-input")
                .keyup((event) => this.searchTodo(event));

            // Open statistics event
            $("#statistics")
                .click(() => this.showStatistics());
        });
    };

    showError(err) {
        // Show modal window
        $(".todolist-error-modal").dialog({
            height: window.innerHeight / 4,
            width: window.innerWidth / 3,
            modal: true,
            dialogClass: 'todolist-error-dialog',
            open: function( event, ui ) {
                $(event.target).find(".todolist-error-text").text(err);
            }
        });
    }
    
    createGroup() {
	let groupName = ""
	const newGroupName = prompt("请输入你想添加的分组名称：");
	console.log(newGroupName);
	this.api.addGroupName(newGroupName);
    }
    /**
     * Show create task modal window
     */
    showCreateTask() {
        // Remove old toolbar
        $(".todolist-create-task-modal .ql-toolbar").remove();

        // Setup quill editor
        const quill = new Quill(".todolist-create-task-modal .todolist-task-editor", {
            theme: 'snow'
        });  

        const groupsVariants = $(".todolist-group-button")
            .toArray()
            .map((group) => $(group).find("span").text())
            .filter((group) => group != "all");

        // Hack for normal show autocomplete (FIXME)
        $("input#task-group").click(function() {
            $(this).closest('.ui-dialog')
                .css('z-index', 101)
        });

        // Group input autocomplete
        $("input#task-group").autocomplete({
            source: groupsVariants,
            open: function(event, ui) {
                const zIndex = parseInt($(this).closest('.ui-dialog').css('z-index'), 10);
                $('.ui-autocomplete').css('z-index', zIndex + 1);
            }
        });

        // Create todo event
        $(".todolist-create-task-modal")
            .off("click", ".send-task-button")
            .on("click", ".send-task-button", () => {
                this.createTodo(quill)
            });

        // Show modal window
        $(".todolist-create-task-modal").dialog({
            height: window.innerHeight / 2,
            width: window.innerWidth / 2,
            modal: true,
            close: function( event, ui ) {
                // Clear inputs
                $("#task-group").val("");
                quill.root.innerHTML = "";
            }
        });
    }

    editGroup(event) {
	const $groupButton = $(event.currentTarget).closest('.todolist-group-button');
	// 2. 获取该分组的原始名称
	const oldGroupName = $groupButton.find('.group-name').text().trim();
	const newGroupName = prompt("请输入新的分组名称：", oldGroupName);
	this.api.changeGroupName(oldGroupName, newGroupName);
    }
    
    updateTaskStatus (groupId, todoId, newStatus) {
	const statusList = ['TODO', 'DOING', 'DONE'];
	let statusId = statusList.indexOf(newStatus) + 1;
	this.api.changeTodoStatus(groupId, todoId, statusId);
	console.log(newStatus);
    }

    /**
     * Create new todo
     *  
     * @param {Quill} quill 
     */
    createTodo (quill) {
        const taskText = quill.root.innerHTML;
        const taskGroup = $("#task-group").val().trim()

        if (taskText == "" || taskGroup == "") {
            this.showError("The task or its group cannot be empty");
            return;
        }

        const currentGroup = $(`.todolist-group-button[style="background: rgba(0, 0, 0, 0.1);"]`)
            .attr("group");

        this.api.createNewTodo(taskGroup, taskText).done((data) => {
            if (data.ERROR == undefined) {
                if (["all", data["GROUP-ID"].toString()].includes(currentGroup)) {
                    $(`.todolist-column-body[status=${data["STATUS-ID"]}]`)
                        .append(this.generateTaskElement(
                            data["GROUP-ID"],
                            data["ID"],
                            data["STATUS-TEXT"],
                            data["DATE"],
                            data["TEXT"]
                        ));
                }

                if ($(`.todolist-group-button[group="${data["GROUP-ID"]}"]`).length == 0) {
                    // Append new group
                    $(".todolist-groups-wrapper")
                        .append(this.generateGroupElement({
                            ID:   data["GROUP-ID"],
                            NAME: data["GROUP-NAME"]
                        }));
                    $(`.todolist-group-button[group="${data["GROUP-ID"]}"] span`).click();
                }

                // Close modal
                $(".todolist-create-task-modal").dialog("close");
            } else {
                this.showError(data.ERROR);
            }
        });
    };

    /**
     * Show statistics modal window
     */
    showStatistics () {
        const stringToColor = (str) => {
            let hash = 0;
            let color = '#';

            for (let i = 0; i < str.length; i++) {
              hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            for (let i = 0; i < 3; i++) {
              let value = (hash >> (i * 8)) & 0xFF;
              color += ('00' + value.toString(16)).slice(-2);
            }

            return color;
        }


        this.api.getTodosStats().done((data) => {
            let content = "";
            let lineData = [];

            // Setup data
            for (let stat of data["STATS"]) {
                // If data not exists
                if (!content.includes(`data-group="${stat['GROUP-ID']}"`)) {
                    content += `<div class="statistic-element" data-group="${stat['GROUP-ID']}"></div>`;
                    lineData.push({
                        id:    stat["GROUP-ID"],
                        title: stat["GROUP-NAME"],
                        items: data["STATUSES"]
                            .map((status) => {
                                return {
                                    id:    status["ID"],
                                    name:  status["NAME"],
                                    value: 0,
                                    color: stringToColor(status["NAME"])
                                };
                            }),
                    });
                }

                // Increment group status
                lineData
                    .filter((e) => e.id === stat["GROUP-ID"])
                    .at(0)
                    .items
                    .filter((e) => e.id === stat["STATUS-ID"])
                    .at(0)
                    .value += stat["COUNT"];
            }

            // Show modal window
            $(".todolist-statistics-modal").dialog({
                height: window.innerHeight / 2,
                width: window.innerWidth / 2,
                modal: true,
                open: function( event, ui ) {
                    $(event.target).html(content);

                    // Setup liner bars
                    lineData.forEach((group) => {
                        (new LinerBar(
                            `.statistic-element[data-group="${group.id}"]`, 
                            group
                        )).render();
                    });
                }
            });
        })
    };

    /**
     * Generate html for todo element
     * 
     * @param   {int}    group 
     * @param   {int}    id 
     * @param   {int}    status 
     * @param   {string} date 
     * @param   {string} text 
     * @returns {string}
     */
generateTaskElement (group, id, statusText, date, text) {
    // 要使用的状态列表
    const statusList = ['TODO', 'DOING', 'DONE'];
    
    // 移除文本中的HTML标签
    text = $("<div>").html(text).text();

    // 使用map生成状态下拉菜单选项
    const statusOptions = statusList.map(status => {
        const selected = (status === statusText) ? ' selected' : '';
        return `<option class="${status}" value="${status}"${selected}>${status}</option>`;
    }).join('');

    // 返回模板字符串
    return `
        <div class="task-element" data-group="${group}" data-id="${id}">
            <div class="task-element-text">
                <span class="task-element-text-todo">${text}</span>
            </div>
            <div>
                <span class="task-date">${date}</span>
                <select class="task-status">
                    ${statusOptions}
                </select>
            </div>
        </div>
    `;
}


    /**
     * Generate html for group button 
     * 
     * @param   {string} taskGroup 
     * @returns {string}
     */
    generateGroupElement (taskGroup) {
        return `
            <div class="todolist-group-button" group="${taskGroup.ID}" style="background: rgba(255, 255, 255);">
                <div class="group-name">${taskGroup.NAME}</div>
                <div class="group-element-tool">
                    <img class="edit" src="./static/images/pencil.svg">
                    <img class="delete" src="./static/images/delete.svg">
                </div>
            </div>
        `
    };

    /**
     * Set white background for all groups
     */
    unselectAllGroup () {
        $(".todolist-groups-wrapper >").each(function() {
            $(this).css("background", "#fff")
        });
    };

    /**
     * Get and draw todos for group
     * 
     * @param {string} group 
     */
    drawTodos (group) {
        // Clear columns
        $(".todolist-body").each((i, column) => {
            $(column).html("");
        });

        this.api.getTodosByGroup(group).done((data) => {
            for (let todo of data) {
                $(`.todolist-body`)
                    .append(this.generateTaskElement(
                        todo["GROUP-ID"],
                        todo["ID"],
                        todo["STATUS-NAME"],
                        todo["DATE"],
                        todo["TEXT"]
                    ));
            }
        });

    };

    /**
     * Select group
     * 
     * @param {string} group 
     */
    selectGroup (group) {
        this.unselectAllGroup();
        $(`.todolist-group-button[group="${group}"]`).css("background", "rgba(0, 0, 0, 0.1)");
        this.drawTodos(group);
    };

    /**
     * Select group event handler
     * 
     * @param {Event} event 
     */
    selectGroupClick (event) {
        const groupElement = $(event.target).closest(".todolist-group-button");
        const group = $(groupElement).attr("group");
        this.selectGroup(group);
    };

    /**
     * Delete group event handler
     * 
     * @param {Event} event 
     */
    deleteGroup (event) {
        const groupElement = $(event.target).closest(".todolist-group-button");
        const group = $(groupElement).attr("group");

        this.api.deleteGroup(group).done((data) => {
            if (data.ERROR == undefined) {
                $(`.todolist-group-button[group="${group}"]`).remove();
                $(`.todolist-group-button[group="all"] span`).click();
            } else {
                this.showError(data.ERROR);
            }
        });
    };

    /**
     * Delele todo event handler
     * 
     * @param {Event} event 
     */
    deleteTodo (event) {
        const todoElement = $(event.target).closest(".task-element");
        const groupId = $(todoElement).attr("group");
        const todoId = $(todoElement).attr("todo-id");

        this.api.deleteTodo(groupId, todoId).done((data) => {
            if (data.ERROR == undefined) {
                $(`.task-element[todo-id='${data["ID"]}'][group='${data["GROUP-ID"]}']`).remove();
            } else {
                this.showError(data.ERROR);
            }
        });
    };

    /**
     * Open edit window for todo
     * 
     * @param {Event} event 
     */
    editTodo (event) {
        const todoElement = $(event.target).closest(".task-element");
        const groupId = $(todoElement).attr("group");
        const todoId = $(todoElement).attr("todo-id");
        const $this = this;

        this.api.getTodoByGroupAndId(groupId, todoId).done((data) => {
            if (data.ERROR == undefined) {
                // Remove old toolbar
                $(".todolist-edit-task-modal .ql-toolbar").remove();

                // Setup quill editor
                const quill = new Quill(".todolist-edit-task-modal .todolist-task-editor", {
                    theme: 'snow'
                }); 
                quill.root.innerHTML = data["TEXT"];

                // Show modal window
                $(".todolist-edit-task-modal").dialog({
                    height: window.innerHeight / 2,
                    width: window.innerWidth / 2,
                    modal: true,
                    close: function( event, ui ) {
                        // Clear inputs
                        $("#task-group").val("");
                        quill.root.innerHTML = "";
                    },
                    open: function ( event, ui ) {
                        // Save changes event
                        $(".todolist-edit-task-modal")
                            .off("click", ".edit-task-button")
                            .on("click", ".edit-task-button", () => {
                                $this.api.changeTodoText(groupId, todoId, quill.root.innerHTML)
                                    .done((data) => {
                                        if (data.ERROR == undefined) {
                                            // Generate new html
                                            const newElement = $this.generateTaskElement(
                                                data["GROUP-ID"],
                                                data["ID"],
                                                data["SATUS-NAME"],
                                                data["DATE"],
                                                data["TEXT"]
                                            );
                                            // Replace old task
                                            $(`.task-element[todo-id="${todoId}"][group="${groupId}"]`)
                                                .replaceWith(newElement);
                                            // Close modal
                                            $(".todolist-edit-task-modal").dialog("close");
                                        } else {
                                            this.showError(data.ERROR);
                                        }
                                    });
                            });
                    }
                });
            } else {
                this.showError(data.ERROR);
            }
        });
    };

    /**
     * Search event handler
     */
    searchTodo () {
        const filter = $("#search-input").val().toLowerCase();

        $(".task-element").each((i, element) => {
            const text = $(element).text().toLowerCase();
            $(element).css("display", text.includes(filter) ? "flex" : "none");
        });
    };

}
