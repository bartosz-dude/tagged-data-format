import { describe, expect, test } from "vitest"
import { TaggedDataFormat, TaggedDataFormatObject } from "../index"

describe("creating TDF", () => {
	test("from data format string", () => {
		const str = "data/format"
		const tdf = new TaggedDataFormat(str)
		expect(tdf.toString()).toBe(str)
	})

	test("from data format string with tags", () => {
		const str = "data/format#a#b#c"
		const tdf = new TaggedDataFormat(str)
		expect(tdf.toString()).toBe(str)
	})

	test("from data format string with dynamic tags", () => {
		const str = "data/format#a:a#b:b"
		const tdf = new TaggedDataFormat(str)
		expect(tdf.toString()).toBe(str)
	})

	test("from data format string with tags and dynamic tags", () => {
		const str = "data/format#a#b#c:c#d:d"
		const tdf = new TaggedDataFormat(str)
		expect(tdf.toString()).toBe(str)
	})

	test("from tdf object form", () => {
		const obj: TaggedDataFormatObject = {
			format: "data/format",
			tags: ["a"],
			dynamicTags: ["b:b"],
		}
		const tdf = new TaggedDataFormat(obj)
		expect(tdf.toString()).toBe("data/format#a#b:b")
	})

	test("from tdf other tdf", () => {
		const otherTdf = new TaggedDataFormat("data/format#a#b:b")
		const tdf = new TaggedDataFormat(otherTdf)
		expect(tdf.toString()).toBe("data/format#a#b:b")
	})

	test("tags from base", () => {
		const base = new TaggedDataFormat({
			tags: ["a"],
			dynamicTags: ["b:b"],
		})
		const tdf = new TaggedDataFormat("data/format", base)
		expect(tdf.toString()).toBe("data/format#a#b:b")
	})
})

describe("editing TDF", () => {
	test("adding tag", () => {
		const tdf = new TaggedDataFormat("data/format")
		tdf.addTag("a")
		expect(tdf.toString()).toBe("data/format#a")
	})

	test("adding existing tag", () => {
		const tdf = new TaggedDataFormat("data/format#a")
		tdf.addTag("a")
		expect(tdf.toString()).toBe("data/format#a")
	})

	test("removing existing tag", () => {
		const tdf = new TaggedDataFormat("data/format#a")
		tdf.removeTag("a")
		expect(tdf.toString()).toBe("data/format")
	})
	test("adding dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format")
		tdf.addTag("a:a")
		expect(tdf.toString()).toBe("data/format#a:a")
	})

	test("adding existing dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format#a:a")
		tdf.addTag("a:a")
		expect(tdf.toString()).toBe("data/format#a:a")
	})

	test("removing existing dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format#a:a")
		tdf.removeTag("a:a")
		expect(tdf.toString()).toBe("data/format")
	})

	test("updating dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format#a:a")
		tdf.updateDynamicTag("a:b")
		expect(tdf.toString()).toBe("data/format#a:b")
	})
	test("updating dynamic tag to the same arg", () => {
		const tdf = new TaggedDataFormat("data/format#a:a")
		tdf.updateDynamicTag("a:a")
		expect(tdf.toString()).toBe("data/format#a:a")
	})

	test("updating non existing dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format")
		tdf.updateDynamicTag("a:a")
		expect(tdf.toString()).toBe("data/format#a:a")
	})
})

describe("accessing TDF", () => {
	test("has tag", () => {
		const tdf = new TaggedDataFormat("data/format#a")
		expect(tdf.hasTag("a")).toBe(true)
		expect(tdf.hasTag("b")).toBe(false)
	})

	test("has dynamic tag", () => {
		const tdf = new TaggedDataFormat("data/format#a:a")
		expect(tdf.hasTag("a:")).toBe(true)
		expect(tdf.hasTag("b:")).toBe(false)
	})

	test("object form", () => {
		const tdf = new TaggedDataFormat("data/format#a#b:b")
		expect(tdf.toObject()).toEqual({
			format: "data/format",
			tags: ["a"],
			dynamicTags: ["b:b"],
		})
	})

	test("getters", () => {
		const tdf = new TaggedDataFormat("data/format#a#b:b")
		expect(tdf.format).toBe("data/format")
		expect(tdf.tags).toEqual(["a"])
		expect(tdf.dynamicTags).toEqual(["b:b"])
	})
})

describe("validating TDF", () => {
	test("required format", () => {
		const tdf = new TaggedDataFormat("data/format#a#b:b")
		expect(tdf.validate()).toBe(true)

		tdf.requiredFormat = "data/format"
		expect(tdf.validate()).toBe(true)

		tdf.requiredFormat = "notdata/format"
		expect(tdf.validate()).toBe(false)
	})

	test("required tag", () => {
		const tdf = new TaggedDataFormat("data/format#a#b:b")
		expect(tdf.validate()).toBe(true)

		tdf.requireTag("a")
		expect(tdf.validate()).toBe(true)

		tdf.requireTag("c")
		expect(tdf.validate()).toBe(false)
	})

	test("validating string", () => {
		const tdf = new TaggedDataFormat()

		tdf.requiredFormat = "data/format"

		tdf.requireTag("a")
		tdf.excludeTag("b")

		expect(tdf.validate("data/format#a#b:b")).toBe(true)
		expect(tdf.validate("data/format#b#b:b")).toBe(false)
	})
})
