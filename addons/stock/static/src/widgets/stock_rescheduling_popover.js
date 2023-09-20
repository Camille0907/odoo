/** @odoo-module */
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { PopoverComponent, PopoverWidgetField } from '@stock/widgets/popover_widget';

export class StockReschedulingPopoverComponent extends PopoverComponent {
    setup(){
        this.action = useService("action");
    }

    openElement(ev){
        this.action.doAction({
            res_model: ev.currentTarget.getAttribute('element-model'),
            res_id: parseInt(ev.currentTarget.getAttribute('element-id')),
            views: [[false, "form"]],
            type: "ir.actions.act_window",
            view_mode: "form",
        });
    }
}

export class StockReschedulingPopover extends PopoverWidgetField {
    setup(){
        super.setup();
        this.color = this.jsonValue.color || 'text-danger';
        this.icon = this.jsonValue.icon || 'fa-exclamation-triangle';
    }

    showPopup(ev){
        if (!this.jsonValue.late_elements){
            return;
        }
        super.showPopup(ev);
    }
}
StockReschedulingPopover.components = {
    Popover: StockReschedulingPopoverComponent
}

registry.category("fields").add("stock_rescheduling_popover", StockReschedulingPopover);
