;;;; index.lisp

(in-package #:todolist)

(defun version ()
  "Get version of this project"
  (slot-value (asdf:find-system 'todolist) 'asdf:version))

(defun index-page ()
  "Generate index page html"
  (spinneret:with-html-string
    (:doctype)
    (:html
     (:head
      (:meta :http-equiv "refresh" :content "30")
      (:title "todolist")
      (:link :rel "stylesheet" :href "./static/style.css")
      (:link :rel "stylesheet" :href "./static/libs/jquery-ui.css")
      (:link :rel "stylesheet" :href "./static/libs/liner-bar.css")
      (:link :rel "stylesheet" :href "./static/libs/quill.snow.min.css")
      (:link :rel "icon" :type "image/x-icon" :href "./static/images/favicon.ico")
      (:script :src "./static/libs/jquery.min.js")
      (:script :src "./static/libs/jquery-ui.min.js")
      (:script :src "./static/libs/quill.min.js")
      (:script :src "./static/libs/liner-bar.js"))
     (:body
      (:div :class "todolist-wrapper"
	    (:div :class "todolist-header"
		  (:div :class "todolist-logo"
			(:span :class "todolist-logo-text" "Todolist ")
			(version))
		  (:div :class "tools"
			(:div :class "todolist-tools"
			      (:a :id "generate-csv" :href "/api/generate/csv"
				  (:span "CSV"))
			      (:div :id "statistics"
				    (:span "Data")))
			(:div :class "todolist-search-wrapper"
			      (:input :type "text" :id "search-input" :placeholder "请输入关键词"))))
	    (:div :class "todolist-container"
		  (:div :class "todolist-groups-wrapper")
		  (:div :class "todolist-body"))
	    (:footer :class "task-footer"
		     (:div :class "todolist-create-button"
			   (:img :src "./static/images/pencil.svg")
			   (:span :class "add-todo" "代办"))
		     (:div :class "group-create-button"
			   (:img :src "./static/images/pencil.svg")
			   (:span :class "add-group" "分类"))))
      (:div :class "todolist-create-task-modal" :style "display:none" :title "New task"
	    (:div :class "todolist-task-editor")
	    (:div :class "todolist-input-wrapper"
		  (:input :type "text" :id "task-group" :placeholder "Insert task group")
		  (:div :class "send-task-button"
			(:img :src "./static/images/send.svg")
			"Create")))
      (:div :class "todolist-edit-task-modal" :style "display:none" :title "Edit task"
	    (:div :class "todolist-task-editor")
	    (:div :class "edit-task-button"
		  (:img :src "./static/images/save.svg")
		  "Save changes"))
      (:div :class "todolist-statistics-modal" :style "display:none" :title "Statistics")
      (:div :class "todolist-error-modal" :style "display:none" :title "Error"
	    (:div :class "todolist-error-text"))
      (:script :type "module" :src "./static/app.js")))))
