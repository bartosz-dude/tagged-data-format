# tagged-data-format

A utility for creating and parsing data format strings with tags for transfering additional data when using Drag and Drop API.

## Format

Tagged Data Format (TDF) is data format with appended tags at the end, for example `text/data#tag#tag-2`.

Each TDF consists of three parts:

- `text/data` - base data format, this follows normal data format rules ie. two strings sperated by `/`
- `#tag` - a tag, each one is started with `#`. A tag can contain any character with exception of `#` and `:`
- `#dynamic-tag:arg` - a dynamic tag, it's identified by `:` which separates the `#dynamic-tag:` which is the tag itself and `arg` which is a single argument which is dynamically validated

TDF should follow `kebab-case`, but it is not required.

## TDF object form

A TDF can be represented via string like above or via an object whose interface looks like this.

```typescript
interface TaggedDataFormatObject {
 format: `${string}/${string}`
 tags: string[]
 dynamicTags: `${string}:${string}`[]
}
```

Not sure how much use this has, as the string form is required when using the Drag and Drop API. You can use `TaggedDataFormat` to convert from and to this one.

## Usage

### Creating TDFs

To create a TDF you can either make just a string like `example/example#tag#dynamic-tag:arg` or use the `TaggedDataFormat` class.

```typescript
const tdf1 = new TaggedDataFormat("1example/example#tag#dynamic-tag:arg")
console.log(tdf1.toString()) // 1example/example#tag#dynamic-tag:arg

const tdf2 = new TaggedDataFormat({
 format: "2example/example",
 tags: ["tag"],
 dynamicTag: ["dynamic-tag:arg"]
})
console.log(tdf2.toString()) // 2example/example#tag#dynamic-tag:arg

// this creates a new instance with the same data as `tdf2`
const tdf3 = new TaggedDataFormat(tdf2)
console.log(tdf3.toString()) // 2example/example#tag#dynamic-tag:arg

const tdf4 = new TaggedDataFormat()
tdf4.format = "4example/example"
tdf4.addTag("tag")
tdf4.addTag("dynamic-tag:arg") // alternatively tdf4.updateDynamicTag("dynamic-tag:arg")
console.log(tdf4.toString()) // 4example/example#tag#dynamic-tag:arg
```

You can also use another instance of `TaggedDataFormat` as the base for a new one.

```typescript
const base = new TaggedDataFormat({
 tags: ["base-tag"]
})
console.log(base.toString()) // /#base-tag

const tdf = new TaggedDataFormat({
 format: "example/example",
 tags: ["tag"]
}, base)
console.log(tdf.toString()) // example/example#base-tag#tag
```

Like in the example above, `TaggedDatFormat` can create partial TDFs, but they are not proper TDFs, they lack the format. They are useful for using as a base for a proper one.

### Editing TDF

`TaggedDataFormat` provides methods for updating the contained TDF.

Setter for `format`.

```typescript
tdf.format = "example/example"
```

Setter and getter for tags, using the `:` at the end of tag specifies that it has to remove a dynamic tag.

```typescript
tdf.addTag("tag")
tdf.removeTag("tag")

tdf.addTag("dynamic-tag:arg")
tdf.removeTag("dynamic-tag:")
```

This updates a dynamic tag with a new `arg` and if it does not exist, it adds a new dynamic tag.

```typescript
tdf.updateDynamicTag("dynamic-tag:arg")
```

### Accessing TDF

`TaggedDataFormat` provides methods for accesing the contained TDF.

Checks if TDF has a tag.

```typescript
tdf.hasTag("tag")
tdf.hasTag("dynamic-tag:")
```

Returns the string form of the TDF

```typescript
tdf.toString()
```

Returns the object form of the TDF.

```typescript
tdf.toObject()
```

Getter for `format` of a TDF.

```typescript
tdf.format
```

Getter for `tags` array of a TDF.

```typescript
tdf.tags
```

Getter for `dynamicTags` array of a TDF.

```typescript
tdf.dynamicTags
```

### Static Methods

```typescript
const tdfObj = TaggedDataFormat.parseString("example/example#tag#dynamic-tag:arg")
console.log(tdfObj) 
/* 
 {
  format: "example/example",
  tags: ["tag"],
  dynamicTag: ["dynamic-tag:arg"]
 }
*/

const tdfStr = TaggedDataFormat.toString(tdfObj)
console.log(tdfStr) // example/example#tag#dynamic-tag:arg
```

### TDF Validation

`TaggedDataFormat` not only allows to create a TDF, but validate it as well. Using a base or making a new instance from another, all validation requirements are inherited as well.

You can validate via

```typescript
tdf.validate(tdf2)
```

When passed an instance of TDF (`tdf2`) it validates the argument with requirements from this instance (`tdf`). When passed with no argument, it validates itself.

Validation consits of four parts and they are performed in this order.

First is matching base data format. You set the required format via

```typescript
tdf.requiredFormat = "required/format"

console.log(tdf.requiredFormat) // required/format
```

When set to `null` (which is the deafult) skips this check.

Checking for excluded tags, if at least one is present validation fails.

```typescript
tdf.excludeTag("tag")

console.log(tdf.excludedTags) // [ "tag" ]

tdf.unexcludeTag("tag") // removes the "tag" from the excluded tags

```

Checking for required tags, all must be present, otherwise validation fails.

```typescript
tdf.requireTag("tag")

console.log(tdf.requiredTags) // [ "tag" ]

tdf.unrequireTag("tag") // removes the "tag" from the required tags
```

And finally validating dynamic tags, if a validator is set, but the dynamic tag is not present, then validation fails.

```typescript
tdf.setValidator("dynamic-tag:", (arg: string) => arg === "arg")

console.log(tdf.requiredDynamicTags) // [ "dynamic-tag:" ]

tdf.removeValidator("dynamic-tag:") // removes the "dynamic-tag:" from the dynamic tags validators
```

## Support

If you like the package, you can support me by buying me a tea.

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/E1E5Z3TEO)
