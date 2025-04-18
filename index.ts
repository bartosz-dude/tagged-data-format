export type BaseFormat = `${string}/${string}`
export type BasicFormatTag = `${string}`
type DynamicFormatTagBase = `${string}:`
export type DynamicFormatTag = `${DynamicFormatTagBase}${string}`
export type FormatTag = BasicFormatTag | DynamicFormatTag

interface TaggedDataFormatObject {
	format: BaseFormat
	tags: BasicFormatTag[]
	dynamicTags: DynamicFormatTag[]
}

/**
 * Tagged data format ie. `example/example#tag#dynamic-tag:arg` to make transfering additional data easier when using Drag and Drop API
 */
export class TaggedDataFormat {
	#format: BaseFormat
	#tags: Set<BasicFormatTag>
	#dTags: Set<DynamicFormatTag>
	#dValidatiors: Map<DynamicFormatTagBase, (arg: string) => boolean>
	#requiredTags: Set<BasicFormatTag>
	#excludedTags: Set<BasicFormatTag>
	#requiredFormat: string | null = null

	/**
	 * A tagged data format utility
	 * @param tdf tagged data format
	 * @param base an instance from which to inherit data
	 * @returns an instance of TaggedDataFormat
	 */
	constructor(
		tdf?: string | TaggedDataFormat | TaggedDataFormatObject,
		base?: TaggedDataFormat
	) {
		if (tdf === undefined) {
			if (base !== undefined) {
				this.#dValidatiors = new Map(base.#dValidatiors.entries())
				this.#format = base.format
				this.#tags = base.#tags
				this.#dTags = base.#dTags
				this.#requiredTags = base.#requiredTags
				this.#excludedTags = base.#excludedTags
			} else {
				this.#dValidatiors = new Map()
				this.#format = "/"
				this.#tags = new Set()
				this.#dTags = new Set()
				this.#requiredTags = new Set()
				this.#excludedTags = new Set()
			}

			return
		}

		if (typeof tdf === "string") {
			if (base === undefined) {
				const fragments = TaggedDataFormat.parseString(tdf)

				this.#format = fragments.format
				this.#tags = new Set(fragments.tags)
				this.#dTags = new Set(fragments.dynamicTags)
				this.#requiredTags = new Set()
				this.#excludedTags = new Set()
				this.#dValidatiors = new Map()
			} else {
				const fragments = TaggedDataFormat.parseString(tdf)

				this.#format = fragments.format
				this.#tags = new Set([...base.tags, ...fragments.tags])
				this.#dTags = new Set([
					...base.dynamicTags,
					...fragments.dynamicTags,
				])
				this.#requiredTags = base.#requiredTags
				this.#excludedTags = base.#excludedTags
				this.#dValidatiors = base.#dValidatiors
			}

			return
		}

		if (tdf instanceof TaggedDataFormat) {
			if (base === undefined) {
				this.#format = tdf.format
				this.#tags = tdf.#tags
				this.#dTags = tdf.#dTags
				this.#requiredTags = tdf.#requiredTags
				this.#excludedTags = tdf.#excludedTags
				this.#dValidatiors = tdf.#dValidatiors

				return
			} else {
				this.#format = tdf.format
				this.#tags = tdf.#tags.union(base.#tags)
				this.#dTags = tdf.#dTags.union(base.#dTags)
				this.#requiredTags = tdf.#requiredTags.union(base.#requiredTags)
				this.#excludedTags = tdf.#excludedTags.union(base.#excludedTags)
				this.#dValidatiors = new Map([
					...base.#dValidatiors.entries(),
					...tdf.#dValidatiors.entries(),
				])

				return
			}
		}

		if (base === undefined) {
			this.#format = tdf.format
			this.#tags = new Set(tdf.tags)
			this.#dTags = new Set(tdf.dynamicTags)
			this.#requiredTags = new Set()
			this.#excludedTags = new Set()
			this.#dValidatiors = new Map()

			return
		} else {
			this.#format = tdf.format
			this.#tags = new Set([...base.tags, ...tdf.tags])
			this.#dTags = new Set([...base.dynamicTags, ...tdf.dynamicTags])
			this.#requiredTags = new Set()
			this.#excludedTags = new Set()
			this.#dValidatiors = base.#dValidatiors

			return
		}
	}

	/**
	 * Validates a provided tagged data format against required format, excluded tags, required tags, and validators of this instance
	 *
	 * if called without the argument, it performs validation against itself
	 */
	validate(tdf?: TaggedDataFormat): boolean {
		tdf ??= this

		if (
			this.#requiredFormat !== null &&
			this.#requiredFormat !== tdf.#format
		) {
			return false
		}

		if (this.#excludedTags.intersection(tdf.#tags).size > 0) {
			return false
		}

		if (!this.#requiredTags.isSupersetOf(tdf.#tags)) {
			return false
		}

		const validators = this.#dValidatiors.entries()

		for (const [tag, vali] of validators) {
			const found = this.#dTags.values().find((v) => v.startsWith(tag))

			if (found === undefined) {
				return false
			}

			const [foundTag, arg] = found.split(":")

			if (!vali(arg ?? "")) {
				return false
			}
		}

		return true
	}

	/**
	 * Unregisters a tag that cannot be present to pass validation
	 */
	unexcludeTag(tag: BasicFormatTag) {
		this.#excludedTags.delete(tag)
	}

	/**
	 * Registers a tag that cannot be present to pass validation
	 */
	excludeTag(tag: BasicFormatTag) {
		this.#excludedTags.add(tag)
	}

	/**
	 * Unregisters a tag that must be present to pass validation
	 */
	unrequireTag(tag: BasicFormatTag) {
		this.#requiredTags.delete(tag)
	}

	/**
	 * Registers a tag that must be present to pass validation
	 */
	requireTag(tag: BasicFormatTag) {
		this.#requiredTags.add(tag)
	}

	/**
	 * Removes a validator for a dynamic tag
	 */
	removeValidator(tag: `${string}:`) {
		this.#dValidatiors.delete(tag)
	}

	/**
	 * Registers a validator for a dynamic tag
	 *
	 * If one is registered, but a matching dynamic tag is not present in the tagged data format, it will automatically fail
	 */
	setValidator(tag: `${string}:`, fn: (arg: string) => boolean) {
		this.#dValidatiors.set(tag, fn)
	}

	/**
	 * Removes a tag to the tagged data format
	 *
	 * Using `"example:"` will remove a dynamic tag
	 */
	removeTag(tag: `${string}:` | BasicFormatTag) {
		if (tag.includes(":")) {
			const found = this.#dTags.values().find((v) => v.startsWith(tag))
			if (found !== undefined) {
				this.#dTags.delete(found)
			}
		}

		this.#tags.delete(tag)
	}

	/**
	 * Updates, and if not present adds, a dynamic tag
	 */
	updateDynamicTag(tag: DynamicFormatTag) {
		if (tag.includes(":")) {
			const found = this.#dTags.values().find((v) => v.startsWith(tag))
			if (found !== undefined) {
				this.#dTags.delete(found)
			}

			this.#dTags.add(tag as DynamicFormatTag)
		}
	}

	/**
	 * Adds a new tag to the tagged data format
	 */
	addTag(tag: BasicFormatTag | DynamicFormatTag) {
		if (tag.includes(":")) {
			this.#dTags.add(tag as DynamicFormatTag)
			return
		}

		this.#tags.add(tag)
	}

	/**
	 * Checks if tagged data fromat contains specified tag
	 * @param tag end tag with `:` to search through dynamic tags
	 * @returns `true` when a tag is found
	 */
	hasTag(tag: `${string}:` | BasicFormatTag) {
		if (tag.endsWith(":")) {
			const found = this.#dTags.values().find((v) => v.startsWith(tag))
			return found !== undefined
		} else {
			return this.#tags.has(tag)
		}
	}

	/**
	 * Parses string to an object representing tagged data format
	 */
	static parseString(tdf: string): TaggedDataFormatObject {
		const fragments = tdf.split("#")

		const tags = fragments.filter(
			(v) => !v.includes(":")
		) as BasicFormatTag[]
		const dynamicTags = fragments.filter((v) =>
			v.includes(":")
		) as DynamicFormatTag[]

		return {
			format: fragments[0] as BaseFormat,
			tags: tags,
			dynamicTags: dynamicTags,
		}
	}

	/**
	 * Converts this tagged data fromat to it's object representation
	 */
	toObject(): TaggedDataFormatObject {
		return {
			format: this.#format,
			tags: this.#tags.values().toArray(),
			dynamicTags: this.#dTags.values().toArray(),
		}
	}

	/**
	 * Converts this tagged data fromat to it's string form
	 */
	toString() {
		return TaggedDataFormat.toString(this.toObject())
	}

	/**
	 * Converts tagged data fromat object to it's string form
	 */
	static toString(tdf: TaggedDataFormatObject): string {
		let out = tdf.format
		tdf.tags.forEach((v) => (out = out + v.replace("#", "")))
		tdf.dynamicTags.forEach((v) => (out = out + v.replace("#", "")))
		return out as string
	}

	/**
	 * The `example/example` part of tagged data format
	 */
	get format() {
		return this.#format
	}

	/**
	 * Setter for the `example/example` part of tagged data format
	 */
	set format(format) {
		this.#format = format
	}

	/**
	 * Array of the `#example` part of tagged data format
	 */
	get tags() {
		return this.#tags.values().toArray()
	}

	/**
	 * Array of the `#example:arg` part of tagged data format
	 */
	get dynamicTags() {
		return this.#dTags.values().toArray()
	}

	/**
	 * Array of the required `#example` part of tagged data format
	 */
	get requiredTags() {
		return this.#requiredTags.values().toArray()
	}

	/**
	 * Array of the excluded `#example` part of tagged data format
	 */
	get excludedTags() {
		return this.#excludedTags.values().toArray()
	}

	/**
	 * Array of the required `#example:` part of tagged data format
	 */
	get requiredDynamicTags() {
		return this.#dValidatiors.keys().toArray()
	}

	/**
	 * The required format
	 */
	get requiredFormat() {
		return this.#requiredFormat as BaseFormat | null
	}

	/**
	 * Sets the format that is required to pass validation
	 *
	 * If set to `null` this is ignored and automatically passes validation
	 * @default null
	 */
	set requiredFormat(format: BaseFormat | null) {
		this.#requiredFormat = format
	}
}
