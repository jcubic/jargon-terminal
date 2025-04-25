<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output
       method="xml"
       indent="yes"
       encoding="iso-8859-1" />
    <xsl:template match="part">
        <xsl:if test="@id = 'lexicon'">
            <xsl:apply-templates select="glossary"/>
        </xsl:if>
    </xsl:template>
    <xsl:template match="glossterm">
        <name><xsl:value-of select="."/></name>
    </xsl:template>
    <xsl:template match="quote">
        <italic><xsl:value-of select="."/></italic>
    </xsl:template>
    <xsl:template match="emphasis">
        <emphasis><xsl:value-of select="."/></emphasis>
    </xsl:template>
    <xsl:template match="ulink">
        <xsl:value-of select="."/>
    </xsl:template>
    <xsl:template match="glossary">
        <xsl:for-each select="*/glossentry">
            <entry>
                <term><xsl:value-of select="glossterm"/></term>
                <xsl:if test="abbrev">
                    <abbrev>
                    <xsl:for-each select="abbrev/*">
                        <item><xsl:apply-templates select="."/></item>
                    </xsl:for-each>
                    </abbrev>
                </xsl:if>
                <def><xsl:apply-templates select="*/para"/></def>
            </entry>
        </xsl:for-each>
    </xsl:template>
    <xsl:template match="book">
        <jargon>
        <xsl:apply-templates select="part"/>
        </jargon>
    </xsl:template>
</xsl:stylesheet>
