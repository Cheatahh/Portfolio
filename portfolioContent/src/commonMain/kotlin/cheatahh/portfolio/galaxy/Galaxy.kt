@file:OptIn(ExperimentalJsExport::class)

package cheatahh.portfolio.galaxy

import cheatahh.portfolio.content.Experience
import cheatahh.portfolio.content.Portfolio
import cheatahh.portfolio.content.portfolio
import kotlin.js.JsExport
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@JsExport
class Vec3(
    val x: Double,
    val y: Double,
    val z: Double,
)

@JsExport
class Constellation(
    val id: String,
    val name: String,
    val color: String,
    val description: String,
)

@JsExport
class Star(
    val id: String,
    val constellation: String,
    val label: String,
    val title: String,
    val subtitle: String,
    val meta: String,
    val description: Array<String>,
    val points: Array<String>,
    val tags: Array<String>,
    val section: String,
    val position: Vec3,
    val radius: Double,
)

@JsExport
class Lane(
    val from: String,
    val to: String,
)

@JsExport
class Galaxy(
    val home: String,
    val constellations: Array<Constellation>,
    val stars: Array<Star>,
    val lanes: Array<Lane>,
)

@JsExport
fun galaxy(): Galaxy = GALAXY

private val GALAXY by lazy { GalaxyBuilder(portfolio()).build() }

private class GalaxyBuilder(private val portfolio: Portfolio) {

    private val constellations = mutableListOf<Constellation>()
    private val stars = mutableListOf<Star>()
    private val lanes = mutableListOf<Lane>()

    fun build(): Galaxy {
        val home = home()
        career(home)
        academia(home)
        research(home)
        projects(home)
        skills(home)
        return Galaxy(home.id, constellations.toTypedArray(), stars.toTypedArray(), lanes.toTypedArray())
    }

    private fun home(): Star {
        val profile = portfolio.profile
        constellation("origin", "Origin", "#ffd38a", "Where it all starts")
        return star(
            constellation = "origin",
            label = profile.name,
            title = profile.name,
            subtitle = profile.role,
            meta = "${profile.location} · ${profile.availability}",
            description = arrayOf(profile.tagline) + profile.about,
            tags = profile.focus,
            section = "about",
            position = Vec3(0.0, 0.0, 0.0),
            radius = 7.0,
        )
    }

    private fun career(home: Star) {
        constellation("career", "Career", "#a9b4ff", "Six years at Fresenius, in the order I piloted them.")
        val entries = portfolio.experience.reversed().flatMap { job ->
            if (job.rotations.isEmpty()) listOf(job.toStar())
            else job.rotations.reversed().map { rotation ->
                star(
                    constellation = "career",
                    label = rotation.role,
                    title = rotation.role,
                    subtitle = "${rotation.department} · ${job.company}",
                    meta = rotation.period,
                    description = arrayOf(
                        rotation.summary,
                        "One of ${job.rotations.size} yearly rotations during my dual study (${job.period}).",
                    ),
                    section = "experience",
                    radius = 3.0,
                )
            }
        }
        place(entries, arm(angle = -20.0, sweep = 50.0, from = 55.0, to = 165.0))
        chain(listOf(home) + entries)
    }

    private fun Experience.toStar() = star(
        constellation = "career",
        label = role,
        title = role,
        subtitle = "$company · $department",
        meta = "$period · $location",
        points = points,
        tags = tags,
        section = "experience",
        radius = if (current) 4.5 else 3.0,
    )

    private fun academia(home: Star) {
        constellation("academia", "Academia", "#8fd8ff", "Degrees and languages.")
        val degrees = portfolio.education.reversed().map { edu ->
            star(
                constellation = "academia",
                label = edu.degree.substringBefore(","),
                title = edu.degree,
                subtitle = "${edu.school} · ${edu.location}",
                meta = "${edu.period} · ${edu.status}",
                points = edu.points,
                section = "education",
                radius = 3.4,
            )
        }
        val languages = star(
            constellation = "academia",
            label = "Languages",
            title = "Languages",
            subtitle = "Spoken, not compiled",
            points = portfolio.languages.map { "${it.name}: ${it.level}" }.toTypedArray(),
            section = "education",
            radius = 2.4,
        )
        val entries = degrees + languages
        place(entries, arm(angle = 70.0, sweep = 28.0, from = 70.0, to = 135.0))
        chain(listOf(home) + entries)
    }

    private fun research(home: Star) {
        val thesis = portfolio.thesis
        constellation("research", "Research", "#c7aaff", "My master's thesis and the questions it asks.")
        val center = polar(angle = 145.0, distance = 120.0, y = 4.0)
        val main = star(
            constellation = "research",
            label = "Master's Thesis",
            title = thesis.title,
            subtitle = thesis.degree,
            meta = thesis.pipeline.joinToString(" → "),
            description = arrayOf(thesis.summary),
            points = thesis.methods,
            tags = thesis.backends + thesis.baselines,
            section = "research",
            position = center,
            radius = 5.0,
        )
        val moons = thesis.questions.map { q ->
            star(
                constellation = "research",
                label = q.id,
                title = "${q.id} · ${q.topic}",
                subtitle = "Research question",
                description = arrayOf(q.question),
                section = "research",
                radius = 1.6,
            )
        }
        place(moons, ring(center, radius = 24.0))
        lanes += Lane(home.id, main.id)
        moons.forEach { lanes += Lane(main.id, it.id) }
    }

    private fun projects(home: Star) {
        constellation("projects", "Projects", "#f3b0e6", "Things I built, at work and at home.")
        val center = polar(angle = 215.0, distance = 125.0, y = -6.0)
        val all = portfolio.projects.mapIndexed { i, project ->
            star(
                constellation = "projects",
                label = project.title,
                title = project.title,
                subtitle = project.kind,
                description = arrayOf(project.description),
                points = project.points,
                tags = project.tags,
                section = "projects",
                position = if (i == 0) center else null,
                radius = if (i == 0) 4.2 else 3.0,
            )
        }
        val featured = all.first()
        val others = all.drop(1)
        place(others, ring(center, radius = 30.0, phase = 20.0))
        lanes += Lane(home.id, featured.id)
        others.forEach { lanes += Lane(featured.id, it.id) }
    }

    private fun skills(home: Star) {
        constellation("skills", "Skills", "#9ff0c4", "The tools I reach for.")
        val center = polar(angle = 290.0, distance = 125.0, y = 2.0)
        val groups = portfolio.skills.map { group ->
            star(
                constellation = "skills",
                label = group.name,
                title = group.name,
                subtitle = "${group.skills.size} skills",
                tags = group.skills,
                section = "skills",
                radius = 1.8 + group.skills.size * 0.18,
            )
        }
        place(groups, ring(center, radius = 34.0))
        lanes += Lane(home.id, groups.first().id)
        chain(groups)
        if (groups.size > 2) lanes += Lane(groups.last().id, groups.first().id)
    }

    private fun constellation(id: String, name: String, color: String, description: String) {
        constellations += Constellation(id, name, color, description)
    }

    private val unplaced = mutableMapOf<String, Star>()

    private fun star(
        constellation: String,
        label: String,
        title: String,
        subtitle: String,
        meta: String = "",
        description: Array<String> = arrayOf(),
        points: Array<String> = arrayOf(),
        tags: Array<String> = arrayOf(),
        section: String,
        position: Vec3? = null,
        radius: Double,
    ): Star {
        val id = uniqueId("$constellation/${slug(label)}")
        val star = Star(
            id, constellation, label, title, subtitle, meta, description, points, tags, section,
            position ?: ORIGIN, radius,
        )
        if (position == null) unplaced[id] = star else stars += star
        return star
    }

    private fun place(entries: List<Star>, positions: (index: Int, count: Int) -> Vec3) {
        entries.forEachIndexed { i, s ->
            val placed = Star(
                s.id, s.constellation, s.label, s.title, s.subtitle, s.meta, s.description, s.points, s.tags,
                s.section, positions(i, entries.size), s.radius,
            )
            unplaced.remove(s.id)
            stars += placed
        }
    }

    private fun chain(entries: List<Star>) {
        entries.zipWithNext { a, b -> lanes += Lane(a.id, b.id) }
    }

    private fun uniqueId(base: String): String {
        val taken = stars.map { it.id }.toSet() + unplaced.keys
        if (base !in taken) return base
        var n = 2
        while ("$base-$n" in taken) n++
        return "$base-$n"
    }

    private companion object {
        val ORIGIN = Vec3(0.0, 0.0, 0.0)

        fun slug(s: String) = s.lowercase().replace(Regex("[^a-z0-9]+"), "-").trim('-')

        fun rad(deg: Double) = deg * PI / 180.0

        fun polar(angle: Double, distance: Double, y: Double) =
            Vec3(cos(rad(angle)) * distance, y, sin(rad(angle)) * distance)

        fun arm(angle: Double, sweep: Double, from: Double, to: Double) = { i: Int, count: Int ->
            val t = if (count <= 1) 0.0 else i.toDouble() / (count - 1)
            polar(angle + sweep * t, from + (to - from) * t, y = 7.0 * sin(i * 1.7))
        }

        fun ring(center: Vec3, radius: Double, phase: Double = 0.0) = { i: Int, count: Int ->
            val a = rad(phase + 360.0 * i / count)
            Vec3(center.x + cos(a) * radius, center.y + sin(a * 2) * 5.0, center.z + sin(a) * radius)
        }
    }
}
