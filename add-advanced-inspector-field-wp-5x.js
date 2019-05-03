/* jshint esversion: 6 */
/**
 * https://github.com/WordPress/gutenberg/blob/359858da0675943d8a759a0a7c03e7b3846536f5/packages/block-editor/src/hooks/custom-class-name.js
 * This uses the hooks defined in the above file to inject the control field in the global advanced inspector area.
 */

import { assign } from 'lodash';

const { Fragment } = wp.element;
const { InspectorAdvancedControls } = wp.editor;
const {  TextControl } = wp.components;
const { __ } = wp.i18n;
const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;

const addCustomIDField = createHigherOrderComponent( (BlockEdit) => {
	return props => {
		return (
			<Fragment>
				<BlockEdit { ...props } />
				<InspectorAdvancedControls>
					<TextControl
						label={ __('Custom ID', 'domain') }
						value={ props.attributes.customID || '' }
						onChange={ newValue => {
							props.setAttributes({
								customID: newValue !== '' ? sanitizeCustomID(newValue) : undefined,
							});
						}}
					/>
				</InspectorAdvancedControls>
			</Fragment>
		);
	}
}, 'withInspectorControl');
addFilter('editor.BlockEdit', 'core/editor/custom-class-name/with-inspector-control', addCustomIDField);

function addCustomID(settings, name){
	settings.attributes = assign(settings.attributes, {
		customID: {
			type: 'string',
		}
	});
	return settings;
}
addFilter('blocks.registerBlockType', 'core/custom-class-name/attribute', addCustomID);

function outputCustomID(extras, block, attributes){
	if(attributes.customID){
		extras.id = attributes.customID;
	}
	return extras;
}
addFilter('blocks.getSaveContent.extraProps', 'core/custom-class-name/save-props', outputCustomID);

function sanitizeCustomID(val){
	return val.replace(/\s+/, '-').replace(/[^a-z0-9-]/gi, '');
}
