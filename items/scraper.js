//#include include/takeable.js

var label = "Scraper";
var version = "1355086256";
var name_single = "Scraper";
var name_plural = "Scrapers";
var article = "a";
var description = "Wielding  only this hardy flat-edged blade, a song in their heart and a will to succeed, anyone can boast a backpack of Barnacles or a pocket full of Ice. Why that glitch might want a clacking bag and potentially wet pants is not the problem of the scraper. Scraper just scrapes.";
var is_hidden = false;
var has_info = true;
var has_infopage = true;
var proxy_item = null;
var is_routable = false;
var adjusted_scale = 1;
var stackmax = 1;
var base_cost = 300;
var input_for = [];
var parent_classes = ["scraper", "tool_base", "takeable"];
var has_instance_props = true;

var classProps = {
	"collection_id"	: "",	// defined by takeable
	"making_type"	: "",	// defined by tool_base
	"required_skill"	: "",	// defined by tool_base
	"points_capacity"	: "50",	// defined by tool_base (overridden by scraper)
	"display_wear"	: "1",	// defined by tool_base (overridden by scraper)
	"can_repair"	: "1"	// defined by tool_base
};

function initInstanceProps(){
	this.instanceProps = {};
	this.instanceProps.points_remaining = "50";	// defined by tool_base (overridden by scraper)
	this.instanceProps.is_broken = "0";	// defined by tool_base
}

var instancePropsDef = {
	points_remaining : ["Number of hit points remaining"],
	is_broken : ["Is this broken?"],
};

var instancePropsChoices = {
	points_remaining : [""],
	is_broken : [""],
};

var verbs = {};

verbs.pickup = { // defined by takeable
	"name"				: "pick up",
	"ok_states"			: ["in_location"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 50,
	"tooltip"			: "Put it in your pack",
	"is_drop_target"		: false,
	"proximity_override"			: 800,
	"conditions"			: function(pc, drop_stack){

		return this.takeable_pickup_conditions(pc, drop_stack);
	},
	"handler"			: function(pc, msg, suppress_activity){

		return this.takeable_pickup(pc, msg);
	}
};

verbs.party_scraping_off = { // defined by scraper
	"name"				: "party scraping off",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 50,
	"tooltip"			: "Scrape faster",
	"is_drop_target"		: false,
	"conditions"			: function(pc, drop_stack){

		if (pc.imagination_has_upgrade('barnacle_scraping_speed_1')){
			if (pc.party_scraping) { 
				return {state:'enabled'};
			}
		}

		return {state:null};
	},
	"handler"			: function(pc, msg, suppress_activity){

		pc.party_scraping = false;
		pc.sendActivity("You are now scraping faster again. It feels good.");

		return true;
	}
};

verbs.party_scraping_on = { // defined by scraper
	"name"				: "party scraping on",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 50,
	"tooltip"			: "Slow down so other players can join you",
	"is_drop_target"		: false,
	"conditions"			: function(pc, drop_stack){

		if (pc.imagination_has_upgrade('barnacle_scraping_speed_1')){
			if (!pc.party_scraping) { 
				return {state:'enabled'};
			}
		}

		return {state:null};
	},
	"handler"			: function(pc, msg, suppress_activity){

		pc.party_scraping = true;
		pc.sendActivity("You've slowed down your scraping speed.");


		return true;
	}
};

verbs.give = { // defined by takeable
	"name"				: "give",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: true,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 52,
	"tooltip"			: "Or, drag item to player",
	"is_drop_target"		: false,
	"conditions"			: function(pc, drop_stack){

		return this.takeable_give_conditions(pc, drop_stack);
	},
	"handler"			: function(pc, msg, suppress_activity){

		return this.takeable_give(pc, msg);
	}
};

verbs.drop = { // defined by takeable
	"name"				: "drop",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 53,
	"tooltip"			: "Drop it on the ground",
	"is_drop_target"		: false,
	"conditions"			: function(pc, drop_stack){

		return this.takeable_drop_conditions(pc, drop_stack);
	},
	"handler"			: function(pc, msg, suppress_activity){

		return this.takeable_drop(pc, msg);
	}
};

verbs.repair = { // defined by tool_base
	"name"				: "repair",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 55,
	"tooltip"			: "The full repair takes $total_energy energy and $time seconds",
	"is_drop_target"		: true,
	"drop_many"			: true,
	"drop_tip"			: "Repair with your Tinkertool",
	"drop_ok_code"			: function(stack, pc){

		if (this.tsid == stack.tsid) return false;
		if (this.class_tsid == 'tinkertool'){
			if (stack.getClassProp('can_repair') == "0") return false;
			if (stack.isWorking && !stack.isWorking()) return true;
			if (stack.getClassProp('display_wear') == 1 && stack.getInstanceProp('points_remaining') < stack.getClassProp('points_capacity')) return true;
		}
		else if (stack.class_tsid == 'tinkertool'){
			if (this.getClassProp('can_repair') == "0") return false;
			if (this.isWorking && !this.isWorking()) return true;
			if (this.getClassProp('display_wear') == 1 && this.getInstanceProp('points_remaining') < this.getClassProp('points_capacity')) return true;
		}

		return false;
	},
	"conditions"			: function(pc, drop_stack){

		if (this.getClassProp('can_repair') == "0") return {state:null};

		var needs_repair = false;

		if (this.class_tsid == 'tinkertool' && drop_stack){
			if (drop_stack.getClassProp('can_repair') == "0") return {state:null};
			if(drop_stack.class_tsid == 'butterfly_lotion' || drop_stack.class_tsid == 'random_kindness') {
				return {state:null};
			}

			if (drop_stack.getInstanceProp('is_broken') == 1){
				needs_repair = true;
			}
			else if (drop_stack.getInstanceProp('points_remaining') < drop_stack.getClassProp('points_capacity') && drop_stack.getClassProp('display_wear') == 1){
				needs_repair = true;
			}
		}
		else{
			if (this.getInstanceProp('is_broken') == 1){
				needs_repair = true;
			}
			else if (this.getInstanceProp('points_remaining') < this.getClassProp('points_capacity') && this.getClassProp('display_wear') == 1){
				needs_repair = true;
			}
		}

		//if (!needs_repair && this.class_tsid != 'tinkertool') return {state:null};
		if (!needs_repair) return {state:null};

		if ((this.class_tsid != 'tinkertool' || drop_stack) && needs_repair){
			// Find a tinkertool
			function is_tinkertool(it){ return it.class_tsid == 'tinkertool' && it.isWorking() ? true : false; }
			var tinkertool = pc.findFirst(is_tinkertool);

			if (!tinkertool){
				return {state:'disabled', reason: "You need a Tinkertool to repair this."};
			}

			if (!pc.skills_has('tinkering_1')) return {state:'disabled', reason: "You need to know "+pc.skills_get_name('tinkering_1')+" to repair this."};
		}
		else{
			if (needs_repair){
				if (!pc.skills_has('tinkering_3')) return {state:'disabled', reason: "You need to know "+pc.skills_get_name('tinkering_3')+" to repair this."};
			}
			else{
				if (!pc.skills_has('tinkering_1')) return {state:'disabled', reason: "You need to know "+pc.skills_get_name('tinkering_1')+" to use this."};
			}
		}

		//var details = pc.getSkillPackageDetails('tinkering');

		var min_energy = this.getEnergyPerTwoTicksRepair(pc) + 1; // The cost of repairing is 2 ticks minimum

		if (pc.metabolics_get_energy() <= min_energy) return {state:'disabled', reason: "You don't have enough energy to repair this."};

		if (pc.making_is_making()) return {state:'disabled', reason: "You are too busy making something."};

		if (pc['!in_house_deco_mode']){
			return {state:'disabled', reason:"No repairing while decorating."};
		}

		return {state:'enabled'};
	},
	"effects"			: function(pc){

		var ret = pc.trySkillPackage('tinkering');
		var details = pc.getSkillPackageDetails('tinkering');
		var duration = Math.ceil((this.getClassProp('points_capacity')-this.getInstanceProp('points_remaining')) / details.tool_wear);

		ret.time = duration;
		duration = Math.max(duration, 2);

		//pc.sendActivity('Duration '+duration);

		// this comes from tinkertool.onTick(), which removes energy every other tick
		ret.min = this.getEnergyPerTwoTicksRepair(pc);
		ret.energy_cost_per = ret.min / 2;


		// Total energy cost is always rounded up to an even number of ticks.
		if ((duration % 2) != 0) {
			duration += 1;
		}

		ret.total_energy = duration * ret.energy_cost_per;

		return ret;
	},
	"handler"			: function(pc, msg, suppress_activity){

		// If this is the tinkertool, we accept items dropped on us, unless we are broken, and then we do the normal thing
		if (this.class_tsid == 'tinkertool' && (!this.needsRepair() || (msg.target_itemstack_tsid && this.isWorking()))){

			if (msg.target_itemstack_tsid){
				var stack = pc.removeItemStackTsid(msg.target_itemstack_tsid);
				if (!stack) return false;

				this.startRepair(stack);
				return true;
			}
			else{
				// We don't have a way to do this yet, so just growl it
				pc.sendActivity('Choose Repair from the item you want to repair, or drag it onto the Tinkertool!');
				return false;
			}
		}
		else{
			// Find a tinkertool
			if (msg.target_itemstack_tsid){
				var tinkertool = pc.removeItemStackTsid(msg.target_itemstack_tsid);
				if (tinkertool.class_tsid != 'tinkertool' || !tinkertool.isWorking()) return false;
			}
			else{
				function is_tinkertool(it){ return it.class_tsid == 'tinkertool' && it.isWorking() ? true : false; }
				var tinkertool = pc.findFirst(is_tinkertool);
			}

			if (!tinkertool && this.class_tsid != 'tinkertool'){
				return false;
			}
			else if (this.class_tsid == 'tinkertool'){
				var tinkertool = this;
			}

			tinkertool.startRepair(this);
		}

		return true;
	}
};

verbs.scrape = { // defined by scraper
	"name"				: "scrape",
	"ok_states"			: ["in_pack"],
	"requires_target_pc"		: false,
	"requires_target_item"		: false,
	"include_target_items_from_location"		: false,
	"is_default"			: false,
	"is_emote"			: false,
	"sort_on"			: 56,
	"tooltip"			: "Or, drag scraper to a barnacle",
	"is_drop_target"		: false,
	"conditions"			: function(pc, drop_stack){

		if (!this.isWorking()) return {state:'disabled', reason: "This "+this.name_single+" has become broken, and must be repaired."}

		var result1 = this.proxyVerbEnabled(pc, 'mortar_barnacle', 200, 'scrape');
		var result2 = (config.is_dev || pc.is_god) ? this.proxyVerbEnabled(pc, 'ice_knob', 200, 'scrape') : { state:"disabled"};

		if (result1.state == 'enabled' ) {
			this.which = "mortar_barnacle";
			return {state:'enabled'};
		}
		else if (result2.state == 'enabled' ) {
			this.which = "ice_knob";
			return {state:'enabled'};
		}
		else if (result1.state == 'disabled') {
			return result1;
		}
		else if (result2.state == 'disabled') { 
			return result2;
		}

		return {state:'enabled'};
	},
	"handler"			: function(pc, msg, suppress_activity){

		if (!this.isWorking()) return false;

		// find the nearest barnacle and invoke the scrape verb there.
		// this is merely a proxy...

		if (this.which == "mortar_barnacle") {
			if (this.proxyVerb(pc, msg, 'mortar_barnacle', 200, 'scrape')) return true;
		}
		else {
			if (config.is_dev || pc.is_god) { 
				if (this.proxyVerb(pc, msg, 'ice_knob', 200, 'scrape')) return true;
			}
		}

		pc.sendActivity("But there's nothing to scrape!");

		return false;
	}
};

function doBreak(){ // defined by tool_base
	this.setInstanceProp('is_broken', 1);
	this.updateState();
	this.informClient();

	if (this.getClassProp('can_repair') == 0) return;

	var pc = this.apiGetLocatableContainerOrSelf();
	if (!pc || !pc.is_player) return;

	pc.announce_sound('TOOL_BREAKS');

	var txt = "Ooops! You done broke your "+this.name_single+".";
	pc.prompts_add({
		txt		: txt,
		icon_buttons	: false,
		timeout		: 5,
		choices		: [
			{ value : 'ok', label : 'OK' }
		]
	});

	pc.sendActivity(txt);

	pc.quests_inc_counter('tool_broke_'+this.class_tsid, 1);
	if (this.class_tsid == 'irrigator_9000'){
		// http://bugs.tinyspeck.com/5784

		pc.quests_inc_counter('tool_broke_watering_can', 1);
	}
}

function getBaseCost(){ // defined by tool_base
	// [20% of BC] + [80% of BC * current wear/maximum wear)
	// This was producing issues with tools like the gassifier that do not have a points capacity
	if(intval(this.getClassProp('points_capacity'))) {
		return (this.base_cost * 0.2) + (this.base_cost * 0.8 * floatval(this.getInstanceProp('points_remaining')) / intval(this.getClassProp('points_capacity')));
	} else {
		return this.base_cost;
	}
}

function getEnergyPerTwoTicksRepair(pc){ // defined by tool_base
	//if (!pc) { return 0; }

	var details = pc.getSkillPackageDetails('tinkering');

	var energy = Math.round((details.bonus_amount / 100 * ((this.base_cost)/(this.getClassProp('points_capacity')))) * details.tool_wear);

	return energy;
}

function getHitPointModifier(pc){ // defined by tool_base
	return 1;
}

function getTooltipLabel(){ // defined by tool_base
	if (this.getClassProp('display_wear') == 1 && hasIntVal(this.getClassProp('points_capacity')) && this.getClassProp('points_capacity') > 0){
		return this.label + ' ('+floatval(this.getInstanceProp('points_remaining'))+'/'+intval(this.getClassProp('points_capacity'))+')';
	}
	else{
		return this.label;
	}
}

function informClient(){ // defined by tool_base
	var container = this.apiGetLocatableContainerOrSelf();
	if (!container || !container.is_player) return;

	return;
	container.apiSendMsgAsIs({
		type: 'tool_state',
		itemstack_tsid: this.tsid,
		tool_state: this.get_tool_state()
	});
}

function isWorking(points){ // defined by tool_base
	// We need fully-formed instance props
	if (!this.instanceProps || this.instanceProps.points_remaining == undefined){
		this.initInstanceProps();
	}

	// Temp fix to make sure no one's tools became broken unexpectedly
	if (floatval(this.getInstanceProp('points_remaining')) < 0 && intval(this.getClassProp('points_capacity')) != 0){
		this.setInstanceProp('points_remaining', intval(this.getClassProp('points_capacity')));
	}

	// No capacity means it works
	if (!hasIntVal(this.getClassProp('points_capacity')) || intval(this.getClassProp('points_capacity')) == 0) return true;

	// Are we flagged as broken?
	if (intval(this.getInstanceProp('is_broken')) == 1) return false;

	// If we don't display wear, then we're working
	if (intval(this.getClassProp('display_wear')) == 0) return true;

	// Do we have enough points remaining
	if (!points) points = 1;
	var pc = this.getRootContainer();
	if (pc && pc.is_player){
		points *= this.getHitPointModifier(pc);
	}
	return (floatval(this.getInstanceProp('points_remaining')) - points) >= 0 ? true : false;
}

function needsRepair(){ // defined by tool_base
	var needs_repair = false;

	if (this.getInstanceProp('is_broken') == 1){
		needs_repair = true;
	}
	else if (this.getInstanceProp('points_remaining') < this.getClassProp('points_capacity') && this.getClassProp('display_wear') == 1){
		needs_repair = true;
	}

	return needs_repair;
}

function onContainerChanged(oldContainer, newContainer){ // defined by tool_base
	this.updateState();
}

function onConversation(pc, msg){ // defined by tool_base
	if (msg.choice == 'repair-no'){
		this.conversation_end(pc, msg);
	}
	else{
		this.conversation_end(pc, msg);

		var contents = pc.getAllContents();
		if (contents[msg.choice]){
			tinkertool.startRepair(contents[msg.choice]);
		}
		else{
			this.conversation_reply(pc, msg, "Not sure what you mean there...");
		}
	}
}

function onCreate(){ // defined by tool_base
	this.initInstanceProps();
	this.updateLabel();
}

function onLoad(){ // defined by tool_base
	if (this.getInstanceProp('is_broken') == 1) return;
	if (!this.isWorking()){
		this.doBreak();
	}
	else{
		this.updateLabel();
	}
}

function onOverlayDismissed(pc, payload){ // defined by tool_base
	pc.announce_sound_stop(this.class_tsid.toUpperCase());
}

function onPropsChanged(){ // defined by tool_base
	// Set instance prop directly. Don't call setInstanceProp since that will produce a stack overflow
	this.instanceProps['points_remaining'] = floatval(this.instanceProps['points_remaining']);

	this.updateLabel();
	this.updateState();
}

function repair(points){ // defined by tool_base
	this.setInstanceProp('points_remaining', floatval(this.getInstanceProp('points_remaining')) + points);

	if (this.getInstanceProp('points_remaining') > this.getClassProp('points_capacity')){
		this.setInstanceProp('points_remaining', this.getClassProp('points_capacity'));
	}

	if (this.getClassProp('display_wear') == 0 && this.getInstanceProp('points_remaining') == this.getClassProp('points_capacity')){
		this.setInstanceProp('is_broken', 0);
	}
	else if (this.getClassProp('display_wear') == 1 && this.getInstanceProp('points_remaining') > 0){
		this.setInstanceProp('is_broken', 0);
	}

	this.updateLabel();
	this.updateState();

	return this.getClassProp('points_capacity') - this.getInstanceProp('points_remaining');
}

function rollCraftingBonusImagination(pc, recipe_id, count, upgrade_id, chance_of_bonus, bonus_base_cost_percentage){ // defined by tool_base
	if (!pc.imagination_has_upgrade(upgrade_id)) return;

	if (is_chance(chance_of_bonus) || pc.buffs_has('max_luck')){
		var recipe = get_recipe(recipe_id);
		if (!recipe) return;

		var base_cost = 0;
		var item = null;
		var crafting = '';
		for (var i in recipe.outputs){
			item = apiFindItemPrototype(recipe.outputs[i][0]);
			if (item){
				base_cost += item.getBaseCost() * recipe.outputs[i][1] * count;
				if (crafting != '') crafting += ',';
				crafting += recipe.outputs[i][0];
			}
		}

		if (!base_cost) return;

		var change = Math.round(base_cost * bonus_base_cost_percentage);
		var context = {};
		context['tool'] = this.class_id;
		context['crafting'] = crafting;
		context['img_upgrade'] = upgrade_id;
		context['base_cost'] = base_cost;

		var actual = pc.stats_add_xp(change, false, context);

		if (actual > 0) {
			pc.sendActivity('Hey, you got '+actual+' bonus imagination for making that.');
		}
		
	}
}

function updateLabel(){ // defined by tool_base
	if (this.label != this.name_single){
		this.label = this.name_single;
		this.informClient();
	}

	/*if (this.getClassProp('display_wear') == 1 && hasIntVal(this.getClassProp('points_capacity')) && this.getClassProp('points_capacity') > 0){
		this.label = this.name_single + ' (' + this.getInstanceProp('points_remaining') + '/' + this.getClassProp('points_capacity') + ')';
		this.informClient();
	}*/
}

function updateState(){ // defined by tool_base
	if (this.isOnGround()){
		if (this.isWorking()){
			this.setAndBroadcastState('1');
		}
		else{
			this.setAndBroadcastState('broken');
		}
	}
	else{
		if (this.isWorking()){
			this.setAndBroadcastState('iconic');
		}
		else{
			this.setAndBroadcastState('broken_iconic');
		}
	}
}

function use(pc, points){ // defined by tool_base
	if (!this.instanceProps || this.instanceProps.points_remaining == undefined){
		this.initInstanceProps();
	}

	if (this.getClassProp('points_capacity') == 0) return false;

	if (!points) points = 1;

	if (!this.isWorking(points)) return false;

	this.instanceProps.points_remaining = floatval(this.instanceProps.points_remaining) - (points * this.getHitPointModifier(pc));

	// Tools that display wear break at 0
	// Otherwise we roll the dice
	if (this.getInstanceProp('points_remaining') <= 0){
		this.setInstanceProp('points_remaining', 0);

		if (this.getClassProp('display_wear') == 1 || this.has_parent('potion_base')){
			this.doBreak();
		}
		else{
			var chance = 0.10;
			if (this.getClassProp('required_skill')){
				if (pc.skills_get_highest_level(this.getClassProp('required_skill')) == 2){
					chance = 0.05;
				}
			}

			if (is_chance(chance) || pc.buffs_has('max_luck')){
				this.doBreak();
			}
		}
	}

	this.updateLabel();
	return true;
}

// global block from tool_base
var is_tool = true;

function getDescExtras(pc){
	var out = [];

	// automatically generated source information...
	out.push([2, "This can be made with a <a href=\"\/items\/563\/\" glitch=\"item|tinkertool\">Tinkertool<\/a> or purchased from an <a href=\"\/items\/1000001\/\" glitch=\"item|npc_streetspirit_alchemical_goods\">Alchemical Goods Vendor<\/a>, a <a href=\"\/items\/1000005\/\" glitch=\"item|npc_streetspirit_hardware\">Hardware Vendor<\/a> or a <a href=\"\/items\/411\/\" glitch=\"item|npc_tool_vendor\">Tool Vendor<\/a>."]);
	if (pc && !pc.skills_has("tinkering_1")) out.push([2, "You need to learn <a href=\"\/skills\/72\/\" glitch=\"skill|tinkering_1\">Tinkering I<\/a> to use a <a href=\"\/items\/563\/\" glitch=\"item|tinkertool\">Tinkertool<\/a>."]);
	if (pc && !(pc.skills_has("tinkering_5"))) out.push([2, "The recipe for this will become available after you learn <a href=\"\/skills\/76\/\" glitch=\"skill|tinkering_5\">Tinkering V<\/a>."]);
	return out;
}

var tags = [
	"tool"
];

var has_custom_basecost = 1;


// this is a temporary fix, while the client doesn't load item defs
// from the XML files. we pass this data on login events.

function getAssetInfo(){
	return {
		'position': {"x":-21,"y":-14,"w":40,"h":17},
		'thumb': "iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM\/rhtAAAGoElEQVR42u2Y6VOTVxTG+d5qrK21\nHUUWJRJBFiHgLq22KkUREBQF2VoRCQSCyZsNIiGQhC3sEEJIWATEBZdWbWmb7st0ofZ7hz+BP+Hp\nuReiFKXtjC9tZ+qZOXOTfMkvz3POczNvQMDzel7\/gxpUyw+M63ea2i5s9wwJcl9bceRMx8Wo2T5l\njM9eJPOZc6We2rPSvOYiWdA\/Cua5FG\/yquPn6ER\/xQ4MVsXzbnp3G3\/fUxaD2hwpGou2oebMFtSd\n24rq7M1T5hxp9IqCTQpxkt7ymBkGRieGNQl0xqKrLBaaLCnKUkOhOB4CVXoo6vNlMJ7eDHvhNuhP\nhUKbFQohM4SAQ5UrBuhS7fAMqHagWxGNYSEB7ksJqDoZBrl0FQ5sX4OkqJd4s9fss5w3XgfZjMtn\nw1B+fBOBbkZpykYIJ4NTRYfrUEREM9UYoLsqjs449Cjl2BMhQWL46kdw\/k7cugrJ8lfI2i3QnZpX\nj8GpM0KgyQieEh2w8+L2qSGNHE5lLLeWzVxrSSxX6mmAu2SrkbZ7HTpLo1CZFoSq9GBUnNgEbWYo\nKlI3QXTAYY18rou+bFSbyJeAnf2V8TifHMQhF8Mdil2L\/Lc2oK0kCnV5W\/n8lR0LhI7OSwRafjxQ\nfEBmL1OQwTEFnRWxmLc8Dg354TBkhxGMDDZaClfl\/Ag4irfjUkYwyghIOBnCbVaSemeS1osP6Krc\nMce+lLVXLefWsVmkDORR0k5q6bJCKGoi+HvLgnIMsCotmKtXeSIIJckbsT9SIj4gQfmYeld0iaRM\nJAfto3lkEULhzHIO1oJw1OdR529FDW0u29ry1EB+qghOkRKIw3Fr+QKJv8UXo2bG9Du5cqQm3ATI\noBhsPVnMosReKOOhbKFmy8DsZD9ARQqe2LUOB2MWNpyWSlS4UcPuILYUDKyrNBqDFNRMLVuBDK0E\nyKxtJmsv54TR5zI+a6wvJAcic996Alv7RASJCjimS3SwxWg9HwEPzR+ztJZgmJpCZjDsdKXVUSA3\nEFwlqZWd9BpZ+fIT0cN6P4V4vHTVrKiAxrNhPtt7URjR7YKL7lq2AOyKq6EQNnOwcG7ruYMbsC9y\nzVPBHqu3ei5W+oK4d3LG7nWe1MRXUPxOCIznonDF9Ca82r0wE1TLexEw0J17lG6NPdsky4Kx64\/g\nZkSHY2VV5XqcFjWa1IW8dYVHUZAcifxDr2FA2I+dNPRLw9rf7CrcJZP4EqSr8kQHc9uqo902o2\/Q\nbsTiHrAZ0GcRkJLwKrIPvMrhWO9f+MPATqYmQXlWRDGnTZC47QbHUjDWboJzWrSwai7i2J7NyNr7\nGDCBtpPUnJWHvaCMCw2QiA420GwIWg7sEVy9Ft21alh1ZUjZF04KrifFJBwwPuxFx4qAccVsBs9y\nYEvh2mtUEErzkJwYNJO1b93cwZg1s\/ItLx74R618Kpx5Hq7FoIROUTCXeeiQ+Gr9wUqbce6v4Fj3\n1+vQQ3AdJhVaCa5Rq0BjdYVHdLDfpicl90e6TUPNpr8FxuEaGJzmD3AN6hL02vUmUcEeTt8w\/TJ9\nY44arL+7O4ZPJvpxd7AN4x318DbV\/AlcFVqNj+HMqvPotmrFAfx1+mbqLx9dn\/WD+fvnD6\/hh3sT\n+PbOKL6cGoLvmht3GGxnA4ZbLs\/D1WnQSXAOYwWadApYF+BMyiJ01osA+PDj63lLwfz904NJfP\/+\nOL65PYIvbnrx6eQApseduD\/Sg7veDtzsb8FoWx166wQ068sp90pQtwBnKM2Hs8n4bIBjXVbHcnCs\nf7x\/ldv81a1hfH7dg0+uuvDRWB\/uDXfjjqcdU65WXOtrxESXFaPtdegjRW1CKQyKfAgXcnHD0\/5s\ngBlHkvJy0g7P1FZdwFCbhcM8ae8Vbu9n1wbxMc3jg9FefDDUhdtkNVNwsteOMbJ8hJT0NJvgorlk\ntrM5fGZAf6UnvxmUcThJmX40aUavKOSwX5Ot33\/A7B3l9vom3Y\/sfZ\/sveV24IazGVd7bLhCCzTs\nqMUgLVE\/5WEv3cH9jdXiAS4HW1GUjU6zQPPWiU+vDjyy9+5ie7uZvRZ4Wy\/DTVBO6\/zieMlyV2tt\nasBK1mLY82dOoJk2daLHzjfZb++4394WEwbI3r4GLboosCdcLWgxCyv7IGgpLIE60o8kzb57+jj0\nigL0WfUL9pq5vS5mb72AXloWb1cDAv6tSnv7jWg\/bG76EaiLc+CoriR79eixaOCmjGyzCDP\/iQeU\ni2FPpRxE6bkMWCkTi3MzpgKe179cvwPjWnH6dV0C0AAAAABJRU5ErkJggg==",
	};
};

var itemDef = {
	label		: this.label,
	name_plural	: this.name_plural,
	stackmax	: this.stackmax,
	is_hidden	: this.is_hidden,
	has_info	: this.has_info,
	adjusted_scale	: this.adjusted_scale,
	asset_swf_v	: "\/c2.glitch.bz\/items\/2012-05\/scraper-1338252950.swf",
	admin_props	: true,
	obey_physics	: true,
	in_background	: false,
	in_foreground	: false,
	has_status	: false,
	not_selectable	: false,
};

if (this.consumable_label_single) itemDef.consumable_label_single = this.consumable_label_single;
if (this.consumable_label_plural) itemDef.consumable_label_plural = this.consumable_label_plural;

itemDef.verbs = {
};
itemDef.hasConditionalVerbs = 1;
itemDef.emote_verbs = {
};
itemDef.hasConditionalEmoteVerbs = 0;
itemDef.tags = [
	"tool"
];
itemDef.keys_in_location = {
	"p"	: "pickup"
};
itemDef.keys_in_pack = {
	"r"	: "drop",
	"g"	: "give",
	"t"	: "party_scraping_off",
	"y"	: "party_scraping_on",
	"e"	: "repair",
	"c"	: "scrape"
};

// generated ok 2012-12-09 12:50:56 by ali
