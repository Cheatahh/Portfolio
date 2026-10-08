@file:OptIn(ExperimentalJsExport::class)

package cheatahh.portfolio.content

import kotlin.js.JsExport

@JsExport
fun portfolio() = PORTFOLIO

private val PORTFOLIO = Portfolio(
    profile = Profile(
        name = "Florian Stach",
        role = "Software Engineer",
        focus = arrayOf("Kotlin & Android", "Low-Code (OutSystems)", "IT & Tech Lead"),
        tagline = "I do get stuff done.",
        location = "Germany",
        availability = "Open for work, beginning April 2027",
        about = arrayOf(
            "I've spent the last six years at Fresenius, a global healthcare group, building web, mobile and native " +
                "applications that run on manufacturing sites around the world. I regularly act as lead in " +
                "digitalization projects, from gathering requirements on the shop floor to " +
                "development, rollout and support.",
            "Kotlin is my language of choice. I like problems that sit where a platform runs out of road: native " +
                "integrations, FIDO2 authentication over NFC, SQL that has to be fast, and the odd bug that nobody " +
                "dares to crack.",
            "Outside of work I'm finishing an M.Sc. in Computer Science with a thesis on JVM lexer generation. I also " +
                "run a fully self-hosted AI assistant at home, backed by its own knowledge graph, and I write real-time " +
                "graphics with OpenGL and GLSL.",
        ),
        email = null,
        links = arrayOf(
            Link(kind = "linkedin", label = "LinkedIn", url = "https://www.linkedin.com/in/fstach"),
            Link(kind = "github", label = "GitHub", url = "https://github.com/cheatahh"),
        ),
        stats = arrayOf(
            Stat(value = "6+", label = "years building software at Fresenius"),
            Stat(value = "4", label = "roles across security, mobile & manufacturing IT"),
            Stat(value = "12", label = "programming languages in daily rotation"),
            Stat(value = "2027", label = "M.Sc. Computer Science (expected)"),
        ),
    ),
    experience = arrayOf(
        Experience(
            role = "Process & Application Expert",
            company = "Fresenius Kabi",
            department = "Process Digitalization",
            location = "Bad Homburg, Germany",
            period = "Oct 2023 – Present",
            current = true,
            points = arrayOf(
                "Technological lead on process digitalization projects, owning technical decisions, architecture and delivery",
                "Develop web and mobile business applications on OutSystems (HTML, CSS, JavaScript, C#) and a native Android app in Kotlin for features beyond the platform's capabilities",
                "Build central libraries, Cordova plugins and drivers for native Android features, including FIDO2 authentication over NFC and barcode scanning",
                "Optimize SQL queries for performance-critical applications and troubleshoot production issues",
                "Work on site at international production sites to gather requirements and roll out new software; create GxP-compliant test documentation for computer system validation",
            ),
            rotations = arrayOf(),
            tags = arrayOf("Kotlin", "Android", "OutSystems", "FIDO2", "NFC", "Cordova", "SQL", "GxP"),
        ),
        Experience(
            role = "Dual Student, Software Engineering & Cybersecurity",
            company = "Fresenius",
            department = "Yearly rotation through three departments",
            location = "Bad Homburg, Germany",
            period = "Sep 2020 – Sep 2023",
            current = false,
            points = arrayOf(),
            rotations = arrayOf(
                Rotation(
                    role = "Software Engineer",
                    department = "Advanced Manufacturing Operations",
                    period = "2022 – 2023",
                    summary = "Built manufacturing digitalization apps with OutSystems, JavaScript and Android",
                ),
                Rotation(
                    role = "Junior Software Engineer",
                    department = "Mobile Applications",
                    period = "2021 – 2022",
                    summary = "Built digitalization apps with MS PowerApps",
                ),
                Rotation(
                    role = "Junior Consultant",
                    department = "Cyber Resilience",
                    period = "2020 – 2021",
                    summary = "Building the human firewall - Cybersecurity trainings & consulting",
                ),
            ),
            tags = arrayOf("OutSystems", "JavaScript", "Android", "Cordova", "React", "Cybersecurity"),
        ),
    ),
    thesis = Thesis(
        title = "Rethinking Lexer Generation for the JVM: AOT DFA Compilation vs. ANTLR4's ATN Interpretation",
        degree = "Master's thesis · Frankfurt University of Applied Sciences",
        summary = "ANTLR4 interprets an augmented transition network at runtime and builds its DFA lazily. My thesis asks " +
            "what happens if you do all of that work ahead of time instead. I'm building a lexer generator in Kotlin that compiles grammars into " +
            "minimized DFAs and emits JVM code from them, then benchmarking it against ANTLR4 and JFlex.",
        pipeline = arrayOf("Grammar", "Regex", "NFA", "DFA", "Minimized DFA", "Codegen"),
        backends = arrayOf("Table-driven", "Switch-based", "Bytecode Assembly"),
        baselines = arrayOf("ANTLR4", "JFlex"),
        methods = arrayOf(
            "JMH benchmarks: throughput, latency, memory & GC pressure",
            "Generated code size and generator build time",
            "Statistical analysis with confidence intervals",
            "Differential, property-based and fuzz testing",
        ),
        questions = arrayOf(
            ResearchQuestion("RQ1", "Performance", "How does an AOT minimized-DFA lexer compare to ANTLR4 in throughput and latency as grammars grow?"),
            ResearchQuestion("RQ2", "Memory / GC", "How do allocation and GC pressure differ, and how do they scale with input size?"),
            ResearchQuestion("RQ3", "Artifact cost", "What do build time and generated code size look like on each side?"),
            ResearchQuestion("RQ4", "Design space", "Table-driven, switch-based or bytecode emission: which works best with the JIT?"),
            ResearchQuestion("RQ5", "Expressiveness", "Which features (modes, predicates, Unicode, error recovery) does a minimal generator give up for speed?"),
        ),
    ),
    projects = arrayOf(
        Project(
            title = "Self-Hosted AI Home Assistant",
            kind = "Personal project",
            description = "A private, fully local AI assistant running on a self-hosted LLM, with a knowledge graph as its long-term memory.",
            points = arrayOf(
                "LLM served locally via llama.cpp, so no data leaves the house",
                "RDF/RDFS knowledge graph as memory, including indexed document storage",
                "The LLM has full create, read, update and delete access to the graph",
                "Voice command satellites in every room serve as terminals",
                "Cameras with face recognition, door-, glass- & trip-sensors feeding into a central security system",
                "Custom-built VPN tunnel for remote access without a static IP or port forwarding",
            ),
            tags = arrayOf("llama.cpp", "LLM tools", "RDF", "Knowledge Graph", "Voice", "Camera", "VPN")
        ),
        Project(
            title = "FIDO2 over NFC on Android Browsers",
            kind = "At Fresenius",
            description = "Central libraries and Cordova plugins that bring native Android features into browser apps.",
            points = arrayOf(
                "FIDO2 support via NFC on Android Browsers is lacking. ",
                "I've built a mapping layer allowing for full FIDO2 authentication " +
                "over NFC for OutSystems and other embedded applications."
            ),
            tags = arrayOf("Kotlin", "Android", "FIDO2", "NFC", "Cordova")
        ),
        Project(
            title = "BitField Annotation Processor",
            kind = "Personal project",
            description = "A Kotlin annotation processor that provides type-safe virtual accessors for defining and manipulating bit-level fields within compact binary data.",
            points = arrayOf(
                "Declarative bitfield mappings using a repeatable @BitField annotation",
                "KSP processor generates virtual getters, setters and constructors at compile time",
                "Supports automatic and explicit bit offsets for compact binary layouts",
                "Works with signed and unsigned fixed-size primitive types",
                "Supports value-like wrapper classes for type-safe bitfield representations",
                "Designed for compact binary formats such as protocol headers and memory-mapped data",
                "Generated accessors allow bit-level data to be manipulated through regular Kotlin properties",
            ),
            tags = arrayOf("Kotlin", "KSP", "Annotation Processing", "Bitfields", "Binary Data", "Code Generation")
        ),
        Project(
            title = "License plate reader from Scratch",
            kind = "Personal project",
            description = "An Android computer-vision application for detecting and reading vehicle license plates from camera images.",
            points = arrayOf(
                "Android application for processing camera images",
                "Computer-vision pipeline for detecting and recognizing license plates",
                "Extracts license plate information directly from captured images",
                "Built as a practical computer-vision project for Android",
                "Designed to combine mobile development with image-based license plate recognition",
            ),
            tags = arrayOf("Android", "Computer Vision", "License Plate Recognition", "Image Processing", "Kotlin")
        ),
        Project(
            title = "Stateful Turtle Base",
            kind = "Personal project",
            description = "A Lua script base for Minecraft ComputerCraft turtles that preserves program state across reloads and automatically resumes long-running tasks after shutdowns.",
            points = arrayOf(
                "Persists turtle program state during execution to survive reloads and world restarts",
                "Automatically resumes execution from the point where the turtle was interrupted",
                "Designed for long-running autonomous tasks such as mining operations",
                "Provides a simple instruction-based structure for building turtle programs",
                "Supports looping programs and graceful termination through KeyboardInterrupt events",
                "Integrates with ComputerCraft's startup mechanism for automatic program execution",
            ),
            tags = arrayOf("Lua", "ComputerCraft", "Minecraft", "Automation", "Turtle", "State Persistence")
        ),
        Project(
            title = "Brainfuck Interpreter",
            kind = "Personal project",
            description = "A minimal Brainfuck interpreter written in C, optimized down to just 175 bytes of source code while remaining a functional command-line interpreter.",
            points = arrayOf(
                "Complete Brainfuck interpreter implemented in C",
                "Extremely compact 175-byte source implementation",
                "Brainfuck programs are supplied directly as command-line arguments",
                "Includes verbose implementations alongside the minimized version for readability and inspection",
                "Uses explicit type specifications and casts despite the aggressive size optimization",
                "Built with CMake for straightforward compilation",
            ),
            tags = arrayOf("C", "Brainfuck", "Interpreter", "Code Golf", "Minimalism", "CMake")
        )
    ),
    skills = arrayOf(
        SkillGroup("Languages", arrayOf("Kotlin", "Java", "C#", "C++", "C", "JavaScript", "TypeScript", "Python", "SQL", "Lua", "HTML", "CSS")),
        SkillGroup("Platforms & Frameworks", arrayOf("Android", "OutSystems", "React", ".NET", "Cordova", "Compose", "Ktor")),
        SkillGroup("Compilers & JVM", arrayOf("ASM", "FSM", "ANTLR4", "JFlex", "JMH benchmarking")),
        SkillGroup("AI & Data", arrayOf("SQL performance tuning", "llama.cpp", "LLM tool integration", "RDF / RDFS knowledge graphs")),
        SkillGroup("Graphics", arrayOf("OpenGL", "GLSL shaders")),
        SkillGroup("Security & Quality", arrayOf("Authentication", "FIDO2", "Cybersecurity", "Polarion ALM", "GxP validation", "Fuzz testing", "Property-based testing")),
        SkillGroup("Professional", arrayOf("IT lead", "Tech lead", "Requirements engineering", "Stakeholder management")),
    ),
    education = arrayOf(
        Education(
            degree = "M.Sc. Computer Science",
            school = "Frankfurt University of Applied Sciences",
            location = "Frankfurt am Main",
            period = "Oct 2024 – Mar 2027",
            status = "Expected 2027",
            points = arrayOf(
                "Part-time alongside employment",
                "Thesis: Rethinking Lexer Generation for the JVM: AOT DFA Compilation vs. ANTLR4's ATN Interpretation",
            ),
        ),
        Education(
            degree = "B.Sc. Computer Science, Cyber Security",
            school = "DHBW Mannheim",
            location = "Mannheim",
            period = "Oct 2020 – Sep 2023",
            status = "Dual study",
            points = arrayOf(
                "Rotations through cybersecurity, mobile development and manufacturing IT",
            ),
        ),
    ),
    languages = arrayOf(
        Language("German", "Native"),
        Language("English", "Fluent (C2)"),
    ),
)