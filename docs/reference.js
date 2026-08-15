const row=function(method,accepts,edge,runtime,example){
    return {method,accepts,edge,runtime,example};
};

const validatorGroups=[
    {
        id:'values',
        title:'Values, primitives, and numbers',
        description:'Exact primitive checks, numeric states, global namespaces, and compatibility aliases.',
        rows:[
            row('defined','Anything except undefined.','null is defined.','Shared','is.defined(null)'),
            row('any','Anything except undefined.','Compatibility alias of defined.','Shared','is.any(0)'),
            row('exists','Anything except undefined.','Compatibility alias of defined.','Shared','is.exists(false)'),
            row('finite','A finite primitive number.','Does not coerce strings, null, or BigInt.','Shared','is.finite(42)'),
            row('finiteNumber','A finite primitive number.','Alias of finite.','Shared','is.finiteNumber(0)'),
            row('NaN','The numeric NaN value.','Uses Number.isNaN; no coercion.','Shared','is.NaN(NaN)'),
            row('nan','The numeric NaN value.','Lowercase alias of NaN.','Shared','is.nan(NaN)'),
            row('null','Exactly null.','undefined does not pass.','Shared','is.null(null)'),
            row('nullish','null or undefined.','All other falsy values fail.','Shared','is.nullish(undefined)'),
            row('boolean','Primitive booleans.','Boxed Boolean objects fail.','Shared','is.boolean(false)'),
            row('bigInt','Primitive bigint values.','Canonical legacy spelling.','Shared','is.bigInt(1n)'),
            row('bigint','Primitive bigint values.','Lowercase alias of bigInt.','Shared','is.bigint(1n)'),
            row('number','Primitive numbers, including NaN and infinities.','Use finite for finite-only checks.','Shared','is.number(3.14)'),
            row('integer','Integer primitive numbers.','Infinity and NaN fail.','Shared','is.integer(42)'),
            row('safeInteger','Safe integer primitive numbers.','Values outside ±(2^53-1) fail.','Shared','is.safeInteger(42)'),
            row('infinity','Exactly positive Infinity.','Kept as the positive-only compatibility method.','Shared','is.infinity(Infinity)'),
            row('infinite','Positive or negative Infinity.','Finite numbers fail.','Shared','is.infinite(-Infinity)'),
            row('positiveInfinity','Exactly positive Infinity.','Alias of infinity.','Shared','is.positiveInfinity(Infinity)'),
            row('negativeInfinity','Exactly negative Infinity.','Positive Infinity fails.','Shared','is.negativeInfinity(-Infinity)'),
            row('negativeZero','Exactly -0.','Uses Object.is, so +0 fails.','Shared','is.negativeZero(-0)'),
            row('string','Primitive strings.','Boxed String objects fail.','Shared',"is.string('type')"),
            row('symbol','Primitive symbols.','Boxed Symbol objects fail.','Shared',"is.symbol(Symbol('type'))"),
            row('undefined','Exactly undefined.','null does not pass.','Shared','is.undefined(undefined)'),
            row('primitive','null or a non-object, non-function value.','Functions and boxed values fail.','Shared',"is.primitive('type')"),
            row('globalThis','Exactly the current globalThis object.','Does not treat host aliases as equivalent.','Shared','is.globalThis(globalThis)'),
            row('atomics','Exactly the global Atomics namespace.','Identity check.','Shared','is.atomics(Atomics)'),
            row('json','Exactly the global JSON namespace.','Identity check.','Shared','is.json(JSON)'),
            row('math','Exactly the global Math namespace.','Identity check.','Shared','is.math(Math)'),
            row('reflect','Exactly the global Reflect namespace.','Identity check.','Shared','is.reflect(Reflect)'),
            row('rawJSON','Values created by JSON.rawJSON.','Guarded until the runtime supports JSON.isRawJSON.','Guarded standard',"is.rawJSON(JSON.rawJSON('1'))")
        ]
    },
    {
        id:'objects',
        title:'Objects, collections, and boxed primitives',
        description:'Portable brand checks are used where JavaScript exposes a safe intrinsic probe.',
        rows:[
            row('array','Arrays from any realm.','Uses Array.isArray.','Shared','is.array([])'),
            row('date','Date objects from any realm.','Invalid dates still pass; use validDate to reject them.','Shared','is.date(new Date)'),
            row('validDate','Date objects with a valid time value.','Invalid Date fails.','Shared','is.validDate(new Date)'),
            row('map','Map objects from any realm.','Proxy-wrapped maps fail native brand checks.','Shared','is.map(new Map)'),
            row('weakMap','WeakMap objects from any realm.','Proxy-wrapped weak maps fail.','Shared','is.weakMap(new WeakMap)'),
            row('object','Values whose typeof result is object.','For compatibility, null passes; use nonNullObject for normal objects.','Shared','is.object(null)'),
            row('nonNullObject','Non-null values whose typeof result is object.','Functions fail.','Shared','is.nonNullObject({})'),
            row('plainObject','Plain or null-prototype records.','Class instances and arrays fail.','Shared','is.plainObject({})'),
            row('nullPrototypeObject','Objects whose prototype is exactly null.','Ordinary object literals fail.','Shared','is.nullPrototypeObject(Object.create(null))'),
            row('argumentsObject','Function arguments objects.','Uses the intrinsic Arguments tag.','Shared','is.argumentsObject(arguments)'),
            row('promise','Promise instances in the current realm.','Thenables use their own structural validator.','Shared','is.promise(Promise.resolve())'),
            row('thenable','Objects or functions with a callable then property.','Structural; it does not invoke then.','Shared','is.thenable({then(){}})'),
            row('regExp','RegExp objects from any realm.','Uses the native RegExp source getter.','Shared','is.regExp(/type/u)'),
            row('regexp','RegExp objects from any realm.','Lowercase-p alias of regExp.','Shared','is.regexp(/type/u)'),
            row('set','Set objects from any realm.','Proxy-wrapped sets fail.','Shared','is.set(new Set)'),
            row('weakSet','WeakSet objects from any realm.','Proxy-wrapped weak sets fail.','Shared','is.weakSet(new WeakSet)'),
            row('boxedPrimitive','Any boxed Boolean, Number, BigInt, String, or Symbol.','Primitive values fail.','Shared','is.boxedPrimitive(Object(1))'),
            row('booleanObject','Boxed Boolean objects.','Primitive booleans fail.','Shared','is.booleanObject(Object(true))'),
            row('numberObject','Boxed Number objects.','Primitive numbers fail.','Shared','is.numberObject(Object(1))'),
            row('bigIntObject','Boxed BigInt objects.','Primitive bigints fail.','Shared','is.bigIntObject(Object(1n))'),
            row('stringObject','Boxed String objects.','Primitive strings fail.','Shared',"is.stringObject(Object('type'))"),
            row('symbolObject','Boxed Symbol objects.','Primitive symbols fail.','Shared',"is.symbolObject(Object(Symbol('type')))")
        ]
    },
    {
        id:'functions',
        title:'Functions, generators, and protocols',
        description:'Function flavors use their native tags; protocols use null-safe structural checks.',
        rows:[
            row('function','Any value whose typeof result is function.','Includes async and generator functions.','Shared','is.function(()=>{})'),
            row('callable','Any function-valued object.','Alias of function; callable proxies are included.','Shared','is.callable(class Type{})'),
            row('asyncFunction','Async functions.','Ordinary functions fail.','Shared','is.asyncFunction(async()=>{})'),
            row('generatorFunction','Generator functions.','Generator objects use generator.','Shared','is.generatorFunction(function*(){})'),
            row('asyncGeneratorFunction','Async generator functions.','Async generator objects use asyncGenerator.','Shared','is.asyncGeneratorFunction(async function*(){})'),
            row('generator','Generator iterator objects.','Generator functions fail.','Shared','is.generator((function*(){})())'),
            row('asyncGenerator','Async generator iterator objects.','Async generator functions fail.','Shared','is.asyncGenerator((async function*(){})())'),
            row('iterator','Values with a callable next method.','Structural by design.','Shared','is.iterator([1].values())'),
            row('asyncIterator','Values with next and Symbol.asyncIterator methods.','Structural by design.','Shared','is.asyncIterator((async function*(){})())'),
            row('iterable','Values with a callable Symbol.iterator method.','Strings and collections pass.','Shared','is.iterable(new Set)'),
            row('asyncIterable','Values with a callable Symbol.asyncIterator method.','Structural by design.','Shared','is.asyncIterable((async function*(){})())')
        ]
    },
    {
        id:'errors',
        title:'Errors',
        description:'The complete standard Error family, including newer guarded resource-management errors.',
        rows:[
            row('error','Error instances.','Realm-local where no safe intrinsic brand probe exists.','Shared','is.error(new Error)'),
            row('aggregateError','AggregateError instances.','Guarded on older runtimes.','Guarded standard','is.aggregateError(new AggregateError([]))'),
            row('evalError','EvalError instances.','Other Error subclasses fail.','Shared','is.evalError(new EvalError)'),
            row('rangeError','RangeError instances.','Other Error subclasses fail.','Shared','is.rangeError(new RangeError)'),
            row('referenceError','ReferenceError instances.','Other Error subclasses fail.','Shared','is.referenceError(new ReferenceError)'),
            row('syntaxError','SyntaxError instances.','Other Error subclasses fail.','Shared','is.syntaxError(new SyntaxError)'),
            row('typeError','TypeError instances.','Other Error subclasses fail.','Shared','is.typeError(new TypeError)'),
            row('URIError','URIError instances.','Canonical compatibility spelling.','Shared','is.URIError(new URIError)'),
            row('uriError','URIError instances.','Lowercase alias of URIError.','Shared','is.uriError(new URIError)'),
            row('suppressedError','SuppressedError instances.','Guarded until explicit resource management is available.','Guarded standard',"is.suppressedError(new SuppressedError(error,suppressed,'cleanup'))")
        ]
    },
    {
        id:'binary',
        title:'Buffers and typed arrays',
        description:'Typed arrays and buffer brands are checked without importing a host adapter.',
        rows:[
            row('typedArray','Any typed array except DataView.','Includes Float16Array where supported.','Shared','is.typedArray(new Uint8Array)'),
            row('arrayBufferView','Any typed array or DataView.','Uses ArrayBuffer.isView.','Shared','is.arrayBufferView(new DataView(new ArrayBuffer(1)))'),
            row('bigInt64Array','BigInt64Array values.','Requires BigInt typed-array support.','Shared','is.bigInt64Array(new BigInt64Array)'),
            row('bigUint64Array','BigUint64Array values.','Requires BigInt typed-array support.','Shared','is.bigUint64Array(new BigUint64Array)'),
            row('float16Array','Float16Array values.','Guarded on runtimes without Float16Array.','Guarded standard','is.float16Array(new Float16Array)'),
            row('float32Array','Float32Array values.','Other typed arrays fail.','Shared','is.float32Array(new Float32Array)'),
            row('float64Array','Float64Array values.','Other typed arrays fail.','Shared','is.float64Array(new Float64Array)'),
            row('int8Array','Int8Array values.','Other typed arrays fail.','Shared','is.int8Array(new Int8Array)'),
            row('int16Array','Int16Array values.','Other typed arrays fail.','Shared','is.int16Array(new Int16Array)'),
            row('int32Array','Int32Array values.','Other typed arrays fail.','Shared','is.int32Array(new Int32Array)'),
            row('uint8Array','Uint8Array values.','Node Buffers also pass because Buffer extends Uint8Array.','Shared','is.uint8Array(new Uint8Array)'),
            row('uint8ClampedArray','Uint8ClampedArray values.','Uint8Array fails.','Shared','is.uint8ClampedArray(new Uint8ClampedArray)'),
            row('uint16Array','Uint16Array values.','Other typed arrays fail.','Shared','is.uint16Array(new Uint16Array)'),
            row('uint32Array','Uint32Array values.','Other typed arrays fail.','Shared','is.uint32Array(new Uint32Array)'),
            row('arrayBuffer','ArrayBuffer values from any realm.','SharedArrayBuffer fails.','Shared','is.arrayBuffer(new ArrayBuffer(8))'),
            row('sharedArrayBuffer','SharedArrayBuffer values.','Guarded where shared memory is unavailable.','Guarded standard','is.sharedArrayBuffer(new SharedArrayBuffer(8))'),
            row('anyArrayBuffer','ArrayBuffer or SharedArrayBuffer values.','Views fail.','Shared','is.anyArrayBuffer(new ArrayBuffer(8))'),
            row('dataView','DataView values from any realm.','Typed arrays fail.','Shared','is.dataView(new DataView(new ArrayBuffer(8)))'),
            row('resizableArrayBuffer','Resizable ArrayBuffer values.','Fixed buffers and unsupported runtimes fail.','Guarded standard','is.resizableArrayBuffer(new ArrayBuffer(8,{maxByteLength:16}))'),
            row('growableSharedArrayBuffer','Growable SharedArrayBuffer values.','Fixed shared buffers fail.','Guarded standard','is.growableSharedArrayBuffer(new SharedArrayBuffer(8,{maxByteLength:16}))'),
            row('detachedArrayBuffer','Transferred/detached ArrayBuffer values.','The fallback probe is non-destructive.','Guarded standard','is.detachedArrayBuffer(buffer)')
        ]
    },
    {
        id:'intl',
        title:'Internationalization',
        description:'Intl brands use native methods or getters and stay guarded when an edition is unavailable.',
        rows:[
            row('intlDateTimeFormat','Intl.DateTimeFormat objects.','Uses resolvedOptions as a brand probe.','Shared','is.intlDateTimeFormat(new Intl.DateTimeFormat)'),
            row('intlCollator','Intl.Collator objects.','Uses resolvedOptions as a brand probe.','Shared','is.intlCollator(new Intl.Collator)'),
            row('intlDisplayNames','Intl.DisplayNames objects.','Guarded on older Intl implementations.','Guarded standard',"is.intlDisplayNames(new Intl.DisplayNames(['en'],{type:'region'}))"),
            row('intlListFormat','Intl.ListFormat objects.','Guarded on older Intl implementations.','Guarded standard','is.intlListFormat(new Intl.ListFormat)'),
            row('intlLocale','Intl.Locale objects.','Uses the native baseName getter.','Shared',"is.intlLocale(new Intl.Locale('en'))"),
            row('intlNumberFormat','Intl.NumberFormat objects.','Uses resolvedOptions as a brand probe.','Shared','is.intlNumberFormat(new Intl.NumberFormat)'),
            row('intlPluralRules','Intl.PluralRules objects.','Uses resolvedOptions as a brand probe.','Shared','is.intlPluralRules(new Intl.PluralRules)'),
            row('intlRelativeTimeFormat','Intl.RelativeTimeFormat objects.','Guarded on older Intl implementations.','Guarded standard','is.intlRelativeTimeFormat(new Intl.RelativeTimeFormat)'),
            row('intlSegmenter','Intl.Segmenter objects.','Guarded on runtimes without Segmenter.','Guarded standard','is.intlSegmenter(new Intl.Segmenter)'),
            row('intlSegments','Objects returned by Segmenter.segment.','Not an arbitrary iterable.','Guarded standard',"is.intlSegments(new Intl.Segmenter().segment('type'))"),
            row('intlDurationFormat','Intl.DurationFormat objects.','Guarded until DurationFormat is available.','Guarded standard','is.intlDurationFormat(new Intl.DurationFormat)')
        ]
    },
    {
        id:'lifetime',
        title:'Lifetime, resources, and Temporal',
        description:'Garbage-collection brands, disposable protocols, resource stacks, and the complete Temporal object family.',
        rows:[
            row('finalizationRegistry','FinalizationRegistry objects.','Guarded on older runtimes.','Guarded standard','is.finalizationRegistry(new FinalizationRegistry(()=>{}))'),
            row('weakRef','WeakRef objects.','Guarded on older runtimes.','Guarded standard','is.weakRef(new WeakRef({}))'),
            row('disposable','Values with a callable Symbol.dispose method.','Structural and guarded until the symbol exists.','Guarded standard','is.disposable({[Symbol.dispose](){}})'),
            row('asyncDisposable','Values with a callable Symbol.asyncDispose method.','Structural and guarded until the symbol exists.','Guarded standard','is.asyncDisposable({[Symbol.asyncDispose](){}})'),
            row('disposableStack','DisposableStack objects.','Guarded until explicit resource management is available.','Guarded standard','is.disposableStack(new DisposableStack)'),
            row('asyncDisposableStack','AsyncDisposableStack objects.','Guarded until explicit resource management is available.','Guarded standard','is.asyncDisposableStack(new AsyncDisposableStack)'),
            row('temporalDuration','Temporal.Duration objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalDuration(Temporal.Duration.from('PT1S'))"),
            row('temporalInstant','Temporal.Instant objects.','Guarded until Temporal is enabled.','Guarded standard','is.temporalInstant(Temporal.Instant.fromEpochMilliseconds(0))'),
            row('temporalPlainDate','Temporal.PlainDate objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalPlainDate(Temporal.PlainDate.from('2026-08-14'))"),
            row('temporalPlainDateTime','Temporal.PlainDateTime objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalPlainDateTime(Temporal.PlainDateTime.from('2026-08-14T12:00'))"),
            row('temporalPlainMonthDay','Temporal.PlainMonthDay objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalPlainMonthDay(Temporal.PlainMonthDay.from('08-14'))"),
            row('temporalPlainTime','Temporal.PlainTime objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalPlainTime(Temporal.PlainTime.from('12:00'))"),
            row('temporalPlainYearMonth','Temporal.PlainYearMonth objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalPlainYearMonth(Temporal.PlainYearMonth.from('2026-08'))"),
            row('temporalZonedDateTime','Temporal.ZonedDateTime objects.','Guarded until Temporal is enabled.','Guarded standard',"is.temporalZonedDateTime(Temporal.ZonedDateTime.from('2026-08-14T12:00[UTC]'))")
        ]
    },
    {
        id:'web-data',
        title:'URL, text, fetch, and data APIs',
        description:'Common Web API constructors shared by modern browsers and increasingly by server runtimes.',
        rows:[
            row('url','URL objects.','Realm-local constructor check.','Guarded Web API',"is.url(new URL('https://example.com'))"),
            row('urlSearchParams','URLSearchParams objects.','Realm-local constructor check.','Guarded Web API',"is.urlSearchParams(new URLSearchParams('a=1'))"),
            row('urlPattern','URLPattern objects.','Not available in every browser or server.','Guarded Web API',"is.urlPattern(new URLPattern({pathname:'/types/:name'}))"),
            row('textEncoder','TextEncoder objects.','Guarded where Encoding API globals are absent.','Guarded Web API','is.textEncoder(new TextEncoder)'),
            row('textDecoder','TextDecoder objects.','Guarded where Encoding API globals are absent.','Guarded Web API','is.textDecoder(new TextDecoder)'),
            row('textEncoderStream','TextEncoderStream objects.','Guarded where stream encoders are absent.','Guarded Web API','is.textEncoderStream(new TextEncoderStream)'),
            row('textDecoderStream','TextDecoderStream objects.','Guarded where stream decoders are absent.','Guarded Web API','is.textDecoderStream(new TextDecoderStream)'),
            row('domException','DOMException objects.','Guarded in non-Web hosts.','Guarded Web API',"is.domException(new DOMException('type'))"),
            row('blob','Blob objects.','Guarded in older server runtimes.','Guarded Web API',"is.blob(new Blob(['type']))"),
            row('file','File objects.','Guarded in hosts without File.','Guarded Web API',"is.file(new File(['type'],'type.txt'))"),
            row('formData','FormData objects.','Guarded in hosts without Fetch globals.','Guarded Web API','is.formData(new FormData)'),
            row('headers','Headers objects.','Guarded in hosts without Fetch globals.','Guarded Web API','is.headers(new Headers)'),
            row('request','Request objects.','Guarded in hosts without Fetch globals.','Guarded Web API',"is.request(new Request('https://example.com'))"),
            row('response','Response objects.','Guarded in hosts without Fetch globals.','Guarded Web API','is.response(new Response)')
        ]
    },
    {
        id:'web-events',
        title:'Events and messaging',
        description:'Cancellation, event, channel, socket, navigation, and storage host objects.',
        rows:[
            row('abortController','AbortController objects.','Guarded where cancellation globals are absent.','Guarded Web API','is.abortController(new AbortController)'),
            row('abortSignal','AbortSignal objects.','Use controller.signal for a value.','Guarded Web API','is.abortSignal(new AbortController().signal)'),
            row('event','Event objects.','Realm-local constructor check.','Guarded Web API',"is.event(new Event('type'))"),
            row('eventTarget','EventTarget objects.','Realm-local constructor check.','Guarded Web API','is.eventTarget(new EventTarget)'),
            row('customEvent','CustomEvent objects.','Not exposed by every server runtime.','Guarded Web API',"is.customEvent(new CustomEvent('type'))"),
            row('messageEvent','MessageEvent objects.','Guarded where messaging globals are absent.','Guarded Web API',"is.messageEvent(new MessageEvent('type'))"),
            row('closeEvent','CloseEvent objects.','Usually browser/WebSocket specific.','Guarded Web API',"is.closeEvent(new CloseEvent('close'))"),
            row('errorEvent','ErrorEvent objects.','Usually browser specific.','Guarded Web API',"is.errorEvent(new ErrorEvent('error'))"),
            row('broadcastChannel','BroadcastChannel objects.','Close channels when finished.','Guarded Web API',"is.broadcastChannel(new BroadcastChannel('types'))"),
            row('messageChannel','MessageChannel objects.','Its ports use messagePort.','Guarded Web API','is.messageChannel(new MessageChannel)'),
            row('messagePort','MessagePort objects.','Usually obtained from MessageChannel.','Guarded Web API','is.messagePort(new MessageChannel().port1)'),
            row('webSocket','WebSocket objects.','Construction may initiate network activity.','Guarded Web API','is.webSocket(socket)'),
            row('eventSource','EventSource objects.','Construction may initiate network activity.','Guarded Web API','is.eventSource(source)'),
            row('navigator','Exactly the current navigator singleton.','Identity check; absent in many server runtimes.','Guarded Web API','is.navigator(navigator)'),
            row('storage','Storage objects such as localStorage.','Access can be restricted by browser policy.','Guarded Web API','is.storage(localStorage)')
        ]
    },
    {
        id:'streams',
        title:'Web Streams',
        description:'Streams, readers, writers, controllers, queuing strategies, and compression streams.',
        rows:[
            row('readableStream','ReadableStream objects.','Different from Node classic streams.','Guarded Web API','is.readableStream(new ReadableStream)'),
            row('readableStreamDefaultReader','Default readable-stream readers.','Usually returned by getReader().','Guarded Web API','is.readableStreamDefaultReader(stream.getReader())'),
            row('readableStreamBYOBReader','Readable byte-stream BYOB readers.','Requires a byte stream.','Guarded Web API',"is.readableStreamBYOBReader(stream.getReader({mode:'byob'}))"),
            row('readableStreamDefaultController','Default readable-stream controllers.','Received by the stream source.','Guarded Web API','is.readableStreamDefaultController(controller)'),
            row('readableByteStreamController','Readable byte-stream controllers.','Received by a byte source.','Guarded Web API','is.readableByteStreamController(controller)'),
            row('readableStreamBYOBRequest','Active BYOB pull requests.','Only exists during an applicable byte-stream pull.','Guarded Web API','is.readableStreamBYOBRequest(controller.byobRequest)'),
            row('writableStream','WritableStream objects.','Different from Node classic streams.','Guarded Web API','is.writableStream(new WritableStream)'),
            row('writableStreamDefaultWriter','Writable-stream writers.','Usually returned by getWriter().','Guarded Web API','is.writableStreamDefaultWriter(stream.getWriter())'),
            row('writableStreamDefaultController','Writable-stream controllers.','Received by the stream sink.','Guarded Web API','is.writableStreamDefaultController(controller)'),
            row('transformStream','TransformStream objects.','Contains readable and writable sides.','Guarded Web API','is.transformStream(new TransformStream)'),
            row('transformStreamDefaultController','Transform-stream controllers.','Received by the transformer.','Guarded Web API','is.transformStreamDefaultController(controller)'),
            row('byteLengthQueuingStrategy','ByteLengthQueuingStrategy objects.','Chunks need a byteLength value.','Guarded Web API','is.byteLengthQueuingStrategy(new ByteLengthQueuingStrategy({highWaterMark:16}))'),
            row('countQueuingStrategy','CountQueuingStrategy objects.','Counts each chunk as one.','Guarded Web API','is.countQueuingStrategy(new CountQueuingStrategy({highWaterMark:1}))'),
            row('compressionStream','CompressionStream objects.','Formats depend on host support.','Guarded Web API',"is.compressionStream(new CompressionStream('gzip'))"),
            row('decompressionStream','DecompressionStream objects.','Formats depend on host support.','Guarded Web API',"is.decompressionStream(new DecompressionStream('gzip'))")
        ]
    },
    {
        id:'platform',
        title:'Crypto, performance, and WebAssembly',
        description:'Shared host services and all standard WebAssembly object/error constructors.',
        rows:[
            row('crypto','Exactly the current crypto singleton.','Identity check.','Guarded Web API','is.crypto(globalThis.crypto)'),
            row('subtleCrypto','Exactly crypto.subtle.','Identity check.','Guarded Web API','is.subtleCrypto(crypto.subtle)'),
            row('cryptoKey','CryptoKey objects.','Usually returned asynchronously by SubtleCrypto.','Guarded Web API','is.cryptoKey(key)'),
            row('performance','Exactly the current performance singleton.','Identity check.','Guarded Web API','is.performance(performance)'),
            row('performanceEntry','PerformanceEntry objects.','Base objects usually come from the timeline.','Guarded Web API','is.performanceEntry(entry)'),
            row('performanceMark','PerformanceMark objects.','Usually returned by performance.mark.','Guarded Web API',"is.performanceMark(performance.mark('type'))"),
            row('performanceMeasure','PerformanceMeasure objects.','Usually returned by performance.measure.','Guarded Web API',"is.performanceMeasure(performance.measure('type'))"),
            row('performanceObserver','PerformanceObserver objects.','Guarded where observer support is absent.','Guarded Web API','is.performanceObserver(new PerformanceObserver(()=>{}))'),
            row('performanceObserverEntryList','Observer entry-list objects.','Only delivered to an observer callback.','Guarded Web API','is.performanceObserverEntryList(list)'),
            row('performanceResourceTiming','Resource timing entries.','Usually browser-created.','Guarded Web API','is.performanceResourceTiming(entry)'),
            row('webAssemblyModule','WebAssembly.Module objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyModule(module)'),
            row('webAssemblyInstance','WebAssembly.Instance objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyInstance(instance)'),
            row('webAssemblyMemory','WebAssembly.Memory objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyMemory(new WebAssembly.Memory({initial:1}))'),
            row('webAssemblyTable','WebAssembly.Table objects.','Element types depend on runtime support.','Guarded standard','is.webAssemblyTable(table)'),
            row('webAssemblyGlobal','WebAssembly.Global objects.','Requires WebAssembly.','Guarded standard',"is.webAssemblyGlobal(new WebAssembly.Global({value:'i32'},0))"),
            row('webAssemblyTag','WebAssembly.Tag objects.','Guarded where exception handling is absent.','Guarded standard','is.webAssemblyTag(tag)'),
            row('webAssemblyException','WebAssembly.Exception objects.','Guarded where exception handling is absent.','Guarded standard','is.webAssemblyException(exception)'),
            row('webAssemblyCompileError','WebAssembly.CompileError objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyCompileError(new WebAssembly.CompileError)'),
            row('webAssemblyLinkError','WebAssembly.LinkError objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyLinkError(new WebAssembly.LinkError)'),
            row('webAssemblyRuntimeError','WebAssembly.RuntimeError objects.','Requires WebAssembly.','Guarded standard','is.webAssemblyRuntimeError(new WebAssembly.RuntimeError)')
        ]
    }
];

const coreMethods=[
    {method:'throw(valueType,expectedType)',result:'true never; false or TypeError','purpose':'Central strict/non-strict failure behavior.'},
    {method:'check(value,pass,expectedType)',result:'true, false, or TypeError','purpose':'Turn a boolean predicate into strong-type behavior.'},
    {method:'typeCheck(value,type)',result:'true, false, or TypeError','purpose':'Validate a typeof result.'},
    {method:'instanceCheck(value,constructor)',result:'true, false, or TypeError','purpose':'Validate a custom class or realm-local constructor.'},
    {method:'symbolStringCheck(value,type)',result:'true, false, or TypeError','purpose':'Validate an intrinsic Object.prototype.toString tag.'},
    {method:'compare(value,target,typeName)',result:'true, false, or TypeError','purpose':'Validate exact identity with Object.is.'},
    {method:'globalInstanceCheck(value,type)',result:'true, false, or TypeError','purpose':'Guard and validate a named global constructor.'},
    {method:'nestedInstanceCheck(value,container,type)',result:'true, false, or TypeError','purpose':'Guard and validate a constructor inside Intl, Temporal, WebAssembly, or another namespace.'},
    {method:'globalValueCheck(value,type)',result:'true, false, or TypeError','purpose':'Validate exact identity with a named global value.'},
    {method:'nestedValueCheck(value,container,type)',result:'true, false, or TypeError','purpose':'Validate exact identity with a named nested value.'},
    {method:'union(value,types)',result:'true, false, or TypeError','purpose':'Accept one named validator from a pipe string or array; supports subclasses.'}
];

const nodeRows=[
    row('buffer','Node Buffer values.','A Uint8Array that is not a Buffer fails.','Node','is.buffer(Buffer.from("type"))'),
    row('nodeStream','Any classic Node Stream.','Web Streams use the shared validators.','Node','is.nodeStream(stream)'),
    row('nodeReadable','Node Readable streams.','Duplex and Transform streams also inherit Readable.','Node','is.nodeReadable(readable)'),
    row('nodeWritable','Node Writable streams.','Duplex and Transform streams also inherit Writable.','Node','is.nodeWritable(writable)'),
    row('nodeDuplex','Node Duplex streams.','Plain readable or writable streams fail.','Node','is.nodeDuplex(duplex)'),
    row('nodeTransform','Node Transform streams.','PassThrough also inherits Transform.','Node','is.nodeTransform(transform)'),
    row('nodePassThrough','Node PassThrough streams.','Other transforms fail.','Node','is.nodePassThrough(passThrough)'),
    row('eventEmitter','Node EventEmitter instances.','DOM EventTarget objects fail.','Node','is.eventEmitter(emitter)'),
    row('timeout','Node Timeout handles.','Capture the return value from setTimeout.','Node','is.timeout(setTimeout(()=>{},1000))'),
    row('immediate','Node Immediate handles.','Capture the return value from setImmediate.','Node','is.immediate(setImmediate(()=>{}))'),
    row('keyObject','Node crypto KeyObject values.','Web CryptoKey uses the shared cryptoKey validator.','Node','is.keyObject(crypto.createSecretKey(bytes))'),
    row('x509Certificate','Node crypto X509Certificate objects.','Requires a parseable certificate.','Node','is.x509Certificate(certificate)'),
    row('proxy','JavaScript Proxy values detected by util.types.','No portable isomorphic proxy test exists.','Node','is.proxy(new Proxy({},{}))'),
    row('moduleNamespaceObject','ES module namespace objects.','Use the result of import().','Node','is.moduleNamespaceObject(await import("./module.js"))'),
    row('external','Native external values detected by util.types.','Usually supplied by a native addon.','Node','is.external(nativeValue)'),
    row('nativeError','Native Error values, including cross-realm errors.','Uses util.types.isNativeError.','Node','is.nativeError(new Error)'),
    row('mapIterator','Native Map iterator objects.','Set iterators fail.','Node','is.mapIterator(new Map().keys())'),
    row('setIterator','Native Set iterator objects.','Map iterators fail.','Node','is.setIterator(new Set().keys())')
];

export {coreMethods,nodeRows,validatorGroups};
