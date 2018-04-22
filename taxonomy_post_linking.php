<?php
/**
 *	An extremely simplified example of the linking of taxonomy terms to an existing post
 *	of any type. Walk through is basically after the term is created or edited, you'll
 *	grab the term slug and look for a post of specific type that has a matching slug.
 *	If found, assign that post's ID to the metadata associated with the current term.
 *	Then, when you're outputting the post type's data you can grab the terms and each
 *	term's metadata, use the term data to output the link text and the metadata to
 *	output the link target.
 *
 *	This example only shows one taxonomy set-up, so you'll have to repeat the scenario
 *	for each taxonomy you want to associate with your custom post type. Also, retieval of
 *	this depends on the user selecting the appropriate taxonomies on the CPT data
 *	entry page. It also depends on there being another custom post type record
 *	with a matching slug to the taxonomy you're creating or editing. The nice thing about
 *	this is that it should work that all you'll have to do to associate existing CPT post
 *	to existing taxonomies is view the existing taxnomy record in edit mode and click
 *	'update' to create the association.
 *
 *	Please backup the database before trying that, of course.
 *
 *	Also note there is a 32-character limit on taxonomy names. I mention this only
 *	because it's bitten me on more than one occasion. The limit on metadata keys is
 *	255 chars, so that shouldn't be a problem.
 */

$fn = new Theme();
/**
 *	In the theme's functions.php file, activate the hooks to save the data for
 *	the taxonomies on creation and update.
 *
 *	@see https://developer.wordpress.org/reference/hooks/created_taxonomy/
 *	@see https://developer.wordpress.org/reference/hooks/edited_taxonomy/
 *
 */
add_action('created_aw_test_tax', array($fn, 'createTaxMeta'), 0 ,2);
add_action('edited_aw_test_tax', array($fn, 'updateTaxMeta'), 0 ,2);

class Theme{
/**
 *	Register the custom taxonomies.
 *
 *	@see https://codex.wordpress.org/Function_Reference/register_taxonomy
 *
 *	@return		void
 */
	private function registerTaxonomy(){
		$args = array(
			'label' => __('Testing', 'aw'),
			'hierarchical' => true,
			'public' => true,
			'show_ui' => true,
			'show_admin_column' => true,
			'capabilities' => array(
				'assign_terms' => 'edit_posts',
			)
		);
		register_taxonomy('aw_test_tax', 'post', $args);
	}
/**
 *	By the time the control passes to this method, the taxonomy is already saved.
 *	This checks to see if the $_POST data includes the appropriate creation action
 *	index and makes sure the taxonomy is appropriate for this action. If not,
 *	just return null because the taxonomy has already been entered into the database.
 *
 *	@param		int		$termID		Newly updated term ID
 *	@param		int		$termTaxID	Newly updated term_taxonomy record ID. Not strictly necessary, but it's good to know it's there
 *	@return		void
 */
	public function createTaxMeta($termID, $termTaxID){
		if($_POST['action'] !== 'add-tag' || $_POST['taxonomy'] !== 'aw_test_tax'){
			return null;
		}
		$this->saveTaxMeta($termID);
	}
/**
 *	By the time the control passes to this method, the taxonomy is already saved.
 *	This checks to see if the $_POST data includes the appropriate update action
 *	index and makes sure the taxonomy is appropriate for this action. If not,
 *	just return null because the taxonomy has already been entered into the database.
 *
 *	@param		int		$termID		Newly updated term ID
 *	@param		int		$termTaxID	Newly updated term_taxonomy record ID. Not strictly necessary, but it's good to know it's there
 *	@return		void
 */
	public function updateTaxMeta($termID, $termTaxID){
		if($_POST['action'] !== 'editedtag' || $_POST['taxonomy'] !== 'aw_test_tax'){
			return null;
		}
		$this->saveTaxMeta($termID);
	}
/**
 *	This is the method that saves the taxonomy metadata for creation or
 *	updating a taxonomy.
 *
 *	@see https://developer.wordpress.org/reference/functions/update_term_meta/
 *
 *	@param		int		$termID		Newly added or updated term ID
 *	@return		void
 */
	private function saveTaxMeta($termID){
		$term = get_term($termID);
		$associatedPost = get_posts(array(
			'fields' => 'ids',
			'name' => $term->slug,
			'post_type' => 'post',	//whatever your CPT is named
			'post_status' => 'publish',
			'numposts' => 1
		));
		if(!empty($associatedPost)){
			update_term_meta($termID, 'aw_assoc_post_id', intval($associatedPost[0]));
		}
	}
}


/**
 *	In the template file, you'll grab the individual terms and meta for the current provider.
 *	So this would be in the loop, and get_terms would be called once per taxonomy.
 *
 *	@see https://developer.wordpress.org/reference/functions/get_terms/
 *	@see https://developer.wordpress.org/reference/functions/get_term_meta/
 *	@see https://developer.wordpress.org/reference/functions/get_permalink/
 *
 */
$testingTax = get_terms(array(
	'taxonomy' => 'aw_test_tax',
	'hide_empty' => false,
));

foreach($testingTax as $t){
	print('<a href="'.esc_url(get_permalink(get_term_meta($t->term_id, 'aw_assoc_post_id', true))).'" target="_blank" rel="noopener noreferrer">'.esc_attr($t->name).'</a>');
}