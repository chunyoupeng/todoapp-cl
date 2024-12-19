/**
 * UI events
 */
export class TodolistUI {
    constructor (api) {
        this.api = api;
	this.currentGroup = "work";
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
	this.currentGroup = group;
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
