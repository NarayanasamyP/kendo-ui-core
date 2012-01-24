(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget,
        extend = $.extend,
        isFunction = $.isFunction,
        isPlainObject = $.isPlainObject,
        inArray = $.inArray,
        Binder = kendo.data.ModelViewBinder,
        Validator = ui.Validator,
        CHANGE = "change";

    var specialRules = ["url", "email", "number", "date", "boolean"];

    function createAttributes(options) {
        var field = options.model.fields[options.field],
            type = field.type,
            validation = field.validation,
            ruleName,
            DATATYPE = kendo.attr("type"),
            VALUE = kendo.attr("value"),
            CHECKED = kendo.attr("checked"),
            rule,
            attr = {
                name: options.field
            };

        for (ruleName in validation) {
            rule = validation[ruleName];

            if (inArray(ruleName, specialRules) >= 0) {
                attr[DATATYPE] = ruleName;
            } else if (!isFunction(rule)) {
                attr[ruleName] = isPlainObject(rule) ? rule.value || ruleName : rule;
            }

            attr[kendo.attr(ruleName + "-msg")] = rule.message;
        }

        if (inArray(type, specialRules) >= 0) {
            attr[DATATYPE] = type;
        }

        if (type === "boolean") {
            attr[CHECKED] = options.field;
        } else {
            attr[VALUE] = options.field;
        }

        return attr;
    }

    var editors = {
        "number": function(container, options) {
            var attr = createAttributes(options);
            $('<input type="text"/>').attr(attr).appendTo(container).kendoNumericTextBox({ format: options.format });
            $('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
        },
        "date": function(container, options) {
            var attr = createAttributes(options);
            attr[kendo.attr("format")] = options.format;

            $('<input type="text"/>').attr(attr).appendTo(container).kendoDatePicker({ format: options.format });
            $('<span ' + kendo.attr("for") + '="' + options.field + '" class="k-invalid-msg"/>').hide().appendTo(container);
        },
        "string": function(container, options) {
            var attr = createAttributes(options);
            $('<input type="text" class="k-input k-textbox"/>').attr(attr).appendTo(container);
        },
        "boolean": function(container, options) {
            var attr = createAttributes(options);
            $('<input type="checkbox" />').attr(attr).appendTo(container);
        }
    };

    var Editable = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            that.bind([CHANGE], that.options);

            that.refresh();
        },

        options: {
            name: "Editable",
            editors: editors
        },

        editor: function(field, modelField) {
            var that = this,
                editors = that.options.editors,
                isObject = isPlainObject(field),
                fieldName = isObject ? field.field : field,
                model = that.options.model || {},
                fieldType = modelField && modelField.type ? modelField.type : "string",
                editor = isObject && field.editor ? field.editor : editors[fieldType];

            editor = editor ? editor : editors["string"];

            if (modelField) {
                editor(that.element, extend(true, {}, isObject ? field : { field: fieldName }, { model: model }));
            }
        },

        _validate: function(e) {
            var that = this,
                values = {};

            values[e.field] = e.value;

            if (!that.validatable.validate() || that.trigger(CHANGE, { values: values })) {
                e.preventDefault();
            }
        },

        end: function() {
            return this.validatable.validate();
        },

        distroy: function() {
            this.element.removeData("kendoValidator")
                .removeData("kendoEditable");
        },

        refresh: function() {
            var that = this,
                idx,
                length,
                fields = that.options.fields || [],
                container = that.options.fields ? that.element.empty() : that.element,
                model = that.options.model || {},
                rules = {};

            if (!$.isArray(fields)) {
                fields = [fields];
            }

            for (idx = 0, length = fields.length; idx < length; idx++) {
                var field = fields[idx],
                    isObject = isPlainObject(field),
                    fieldName = isObject ? field.field : field,
                    modelField = (model.fields || {})[fieldName],
                    type = modelField ? modelField.type : null,
                    validation = modelField ? (modelField.validation || {}) : {};

                for (var rule in validation) {
                    if (isFunction(validation[rule])) {
                        rules[rule] = validation[rule];
                    }
                }

                that.editor(field, modelField);
            }

            kendo.bind(container, that.options.model);

            that.options.model.bind("set", $.proxy(that._validate, that));

            that.validatable = container.kendoValidator({
                errorTemplate: '<div class="k-widget k-tooltip k-tooltip-validation" style="margin:0.5em"><span class="k-icon k-warning"> </span>' +
                                '${message}<div class="k-callout k-callout-n"></div></div>', rules: rules }).data("kendoValidator");

            container.find(":input:visible:first").focus();
        }
   });

   ui.plugin(Editable);
})(jQuery);
