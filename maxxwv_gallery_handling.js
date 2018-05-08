// maxxwv.com JavaScript Document
/* jshint esversion: 6 */
/* global mwv */
import _ from 'lodash';
import { stringify } from 'query-string';

class Gallery{
	constructor(args){
		this.galleryDiv = args.galleryDiv;
		this.descrDiv = args.descrDiv;
		this._$ = args.$;
		this.duration = parseInt(args.duration) || 1000;

		if(!this.galleryDiv instanceof this._$){
			this.galleryDiv = this._$(this.galleryDiv);
		}
		if(!this.descrDiv instanceof this._$){
			this.descrDiv = this._$(this.descrDiv);
		}
	}
/**
 *	Make all the links triggers for gallery loading.
 *	By doing it this way, I'm making sure that if the user has
 *		javascript turned off, they'll still get to the gallery
 *		page and be able to bookmark it if they want to.
 *	@param		Array	elems	Array of jQuery link objects
 *	@return		void
 */
	activateLinks(elems){
		_.each(elems, link => {
			link.onclick = e => {
				e.preventDefault();
				this._currentClick = e.target;
				this.changeGallery(e.target.parentElement.dataset.albumId);
			};
		});
	}
/**
 *	Run the entire object to change out the gallery dynamically
 *	@param		string	albumID		Numerical DB index of the album in question
 *	@return		void
 */
	changeGallery(albumID){
		this.addOverlay()
			.then(() => this.removeDescription())
			.then(() => this.slideUpGallery())
			.then(() => this.loadAlbumGalleries(albumID))
			.then((data) => this.populateGallery(data))
			.then((slug) => this.updateURL(slug))
			.then(() => this.revealDescription())
			.then(() => this.slideDownGallery())
			.then(() => this.removeOverlay());
	}
/**
 *	Add a fixed overlay div so the user knows something's happening
 */
	addOverlay(){
		return new Promise((resolve) => {
			let ovrly = document.createElement('div'),
				spin = document.createElement('div');
			ovrly.classList.add('overlay');
			ovrly.appendChild(spin);
			spin.classList.add('fa', 'fa-spinner', 'fa-pulse');
			ovrly.id = 'gallery-overlay';
			document.body.appendChild(ovrly);
			resolve(true);
		});
	}
/**
 *	Remove the overlay div
 */
	removeOverlay(){
		document.body.removeChild(document.getElementById('gallery-overlay'));
	}
/**
 *	Remove the main description, assuming it exists
 *	@return		Promise.resolve
 */
	removeDescription(){
		return new Promise((resolve) => {
			this.descrDiv.slideUp(
				this.duration,
				() => {
					this.descrDiv.html('');
					resolve(true);
				}
			);
		});
	}
/**
 *	Slide down the description div for the album
 *	@return		void
 */
	revealDescription(){
		return new Promise((resolve) => {
			this.descrDiv.slideDown(
				this.duration,
				() => {
					resolve(true);
				}
			);
		});
	}
/**
 *	Remove the current gallery
 *	@return		Promise.resolve
 */
	slideUpGallery(){
		return new Promise((resolve) => {
			this.galleryDiv.slideUp(
				this.duration,
				() => {
					this.galleryDiv.html('');
					resolve(true);
				}
			);
		});
	}
/**
 *	Slide down the gallery div
 *	@return		void
 */
	slideDownGallery(){
		return new Promise((resolve) => {
			this.galleryDiv.slideDown(
				this.duration,
				() => {
					resolve(true);
				}
			);
		});
	}
/**
 *	Affect the history state for bookmarks
 *	@param		string	slug	Link to activate
 *	@return		Promise
 */
	updateURL(slug){
		return new Promise((resolve) => {
			let crGall = document.querySelector('.album-link.selected');
			crGall.classList.remove('selected');
			this._currentClick.classList.add('selected');
			window.history.pushState({}, slug, '/design/' + slug);
			resolve(true);
		});
	}
/**
 *	Get the selected album galleries via AJAX and return the data
 *	@param		int		albumID		ID of the selected album
 *	@throws		type
 *	@return		void
 */
	loadAlbumGalleries(albumID){
		return fetch(
			mwv.ajax_url, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
			},
			method: 'post',
			credentials: 'same-origin',
			body: stringify({action: 'get_galleries_by_album', album: albumID}),
		}).then(resp => {
			if(!resp.ok){
				throw new Error(resp);
			}
			return resp.json();
		}).then(data => {
			return data;
		}).catch(err => {
			console.log(err.message);
		});
	}
/**
 *	Use the returned data to populate the gallery div
 *	@param		object	data	JSON-decoded data object from server
 *	@return		Promise
 */
	populateGallery(data){
		return new Promise((resolve, reject) => {
			if(!data.success){
				reject('No galleries found');
			}
			
			let galleryNode = document.createElement('div'),
				slug = '';
			galleryNode.classList.add('flex-wrap');
			this.galleryDiv[0].appendChild(galleryNode);
			
			_.each(data.gallery, g => {
				this.descrDiv.html(g.description);
				if(g.description && this.descrDiv.hasClass('empty')){
					this.descrDiv.removeClass('empty');
				}else{
					if(!this.descrDiv.hasClass('empty')){
						this.descrDiv.addClass('empty');
					}
				}
				_.each(g.images, img => {
					let wrpNode = document.createElement('div');
					wrpNode.classList.add('gallery-wrap');
					wrpNode.dataset.title = img.title;
					let anchorNode = document.createElement('a');
					anchorNode.href = img.sizes.full.url;
					anchorNode.dataset.lightbox = g.title;
					anchorNode.dataset.title = img.description.replace(/(<([^>]+)>)/ig,"");
					anchorNode.classList.add('lazyload');
					let imgNode = new Image(img.sizes.thumbnail.width, img.sizes.thumbnail.height);
					imgNode.src = img.sizes.thumbnail.url;
					imgNode.title = img.title;
					imgNode.alt = img.alt;
					anchorNode.appendChild(imgNode);
					wrpNode.appendChild(anchorNode);
					galleryNode.appendChild(wrpNode);
				});
				slug = this._currentClick.innerHTML;
			});
			resolve(slug);
		});
	}
}

(($) => {
	'use strict';
	let gallery = new Gallery({
		galleryDiv: $('#gallery'),
		descrDiv: $('#gallery-description'),
		$: $
	});
	gallery.activateLinks($('.album-link'));
	var ll = new LazyLoad();
}) (jQuery);
